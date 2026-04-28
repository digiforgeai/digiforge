// app/api/paystack/webhook/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function verifySignature(signature: string, body: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')
  return signature === expectedSignature
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('x-paystack-signature') || ''
  
  if (process.env.NODE_ENV === 'production') {
    if (!verifySignature(signature, body)) {
      console.error('❌ Invalid Paystack signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }
  
  const event = JSON.parse(body)
  console.log('📦 Paystack event received:', event.event)
  
  try {
    // Handle successful charge
    if (event.event === 'charge.success') {
      const data = event.data
      const { metadata, customer } = data
      
      const user_id = metadata?.user_id
      const plan_id = metadata?.plan_id
      
      if (!user_id || !plan_id) {
        console.error('❌ Missing user_id or plan_id in metadata')
        return NextResponse.json({ received: true })
      }
      
      console.log(`💰 Processing payment for user: ${user_id}, plan: ${plan_id}`)
      console.log(`📝 Paystack Data - Customer Code: ${customer?.customer_code}`)
      console.log(`📝 Paystack Data - Subscription Code: ${data.subscription?.subscription_code || 'N/A'}`)
      
      // FIRST: Cancel any existing active plans for this user
      await supabase
        .from('user_plans')
        .update({ 
          status: 'canceled', 
          updated_at: new Date().toISOString() 
        })
        .eq('user_id', user_id)
        .eq('status', 'active')
      
      // SECOND: Insert the new subscription with Paystack data
      const now = new Date()
      const periodEnd = new Date()
      periodEnd.setDate(periodEnd.getDate() + 30)
      
      const { error: insertError } = await supabase
        .from('user_plans')
        .insert({
          user_id: user_id,
          plan_id: plan_id,
          status: 'active',
          paystack_subscription_code: data.subscription?.subscription_code || null,
          paystack_customer_code: customer?.customer_code || null,
          paystack_plan_code: data.plan?.plan_code || null,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
      
      if (insertError) {
        console.error('❌ Failed to insert subscription:', insertError)
      } else {
        console.log(`✅ Subscription activated for user: ${user_id} (${plan_id} plan)`)
      }
      
      // Reset usage tracking
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      const monthStr = startOfMonth.toISOString().split('T')[0]
      
      await supabase
        .from('usage_tracking')
        .upsert({
          user_id: user_id,
          month: monthStr,
          ebook_generations_used: 0,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,month'
        })
      
      console.log(`✅ Usage reset for user: ${user_id}`)
    }
    
    // Handle subscription disabled (cancelled)
    if (event.event === 'subscription.disable') {
      const data = event.data
      console.log(`🔻 Subscription disabled: ${data.subscription_code}`)
      
      // Find the user by subscription code
      const { data: userPlan } = await supabase
        .from('user_plans')
        .select('user_id')
        .eq('paystack_subscription_code', data.subscription_code)
        .single()
      
      if (userPlan) {
        // Cancel the plan
        await supabase
          .from('user_plans')
          .update({ 
            status: 'canceled', 
            updated_at: new Date().toISOString() 
          })
          .eq('paystack_subscription_code', data.subscription_code)
        
        // Check if user already has a free plan
        const { data: existingFree } = await supabase
          .from('user_plans')
          .select('id')
          .eq('user_id', userPlan.user_id)
          .eq('plan_id', 'free')
          .eq('status', 'active')
          .single()
        
        if (!existingFree) {
          // Create free plan
          await supabase
            .from('user_plans')
            .insert({
              user_id: userPlan.user_id,
              plan_id: 'free',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancel_at_period_end: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          
          console.log(`✅ User ${userPlan.user_id} downgraded to free plan`)
        }
      }
    }
    
    return NextResponse.json({ received: true })
    
  } catch (err) {
    console.error('❌ Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}