// app/api/webhook/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import { sendBillingEmail } from '@/lib/email/service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
)

function safeDate(timestamp: number | null | undefined) {
  if (!timestamp) return null
  const d = new Date(timestamp * 1000)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function fallbackEndDate() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('❌ Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('✅ Event received:', event.type)

  try {
    // =========================================================
    // 💰 PAYMENT SUCCESS (MAIN LOGIC)
    // =========================================================
    if (
      event.type === 'invoice.payment_succeeded' ||
      event.type === 'invoice.paid'
    ) {
      const invoice = event.data.object as any

      let subscriptionId = invoice.subscription
      const customerId = invoice.customer

      if (!subscriptionId && customerId) {
        console.log('⚠️ No subscription in invoice, fetching from customer...')
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          limit: 1,
          status: 'all',
        })
        subscriptionId = subs.data[0]?.id
      }

      if (!subscriptionId || !customerId) {
        console.error('❌ Missing subscription/customer')
        return NextResponse.json({ received: true })
      }

      const subscription = (await stripe.subscriptions.retrieve(
        subscriptionId
      )) as any

      const start = safeDate(subscription.current_period_start) || new Date().toISOString()
      const end = safeDate(subscription.current_period_end) || fallbackEndDate()

      console.log('📅 Subscription period:', start, '→', end)

      // Find user by customer ID
      const { data: user } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!user) {
        console.error('❌ User not found for customer:', customerId)
        return NextResponse.json({ received: true })
      }

      const userId = user.id

      // Detect plan from price ID
      const priceId = subscription.items.data[0]?.price?.id

      let newPlanId = 'starter'
      if (priceId === process.env.STRIPE_PRICE_PRO) {
        newPlanId = 'pro'
      } else if (priceId === process.env.STRIPE_PRICE_STARTER) {
        newPlanId = 'starter'
      }

      console.log('💳 New Plan:', newPlanId)

      // Get current active plan
      const { data: currentPlan } = await supabase
        .from('user_plans')
        .select('plan_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      const oldPlanId = currentPlan?.plan_id || 'free'
      console.log(`📊 Plan change: ${oldPlanId} → ${newPlanId}`)

      // 🔥 FORCE RESET USAGE - Direct database update
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthStr = startOfMonth.toISOString().split('T')[0]
      
      console.log(`🔄 Resetting usage for user ${userId} from ${oldPlanId} to ${newPlanId}`)
      
      // Direct update - delete and insert fresh
      const { error: usageError } = await supabase
        .from('usage_tracking')
        .upsert(
          {
            user_id: userId,
            month: monthStr,
            ebook_generations_used: 0,
            updated_at: now.toISOString(),
          },
          {
            onConflict: 'user_id,month',
          }
        )

      if (usageError) {
        console.error('❌ Usage reset failed:', usageError)
      } else {
        console.log('✅ Usage reset to 0 (UPSERT)')
      }

      // Cancel old active plan
      await supabase
        .from('user_plans')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'active')

      // Check if subscription already exists
      const { data: existing } = await supabase
        .from('user_plans')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle()

      if (existing) {
        console.log('♻️ Updating existing subscription')
        await supabase
          .from('user_plans')
          .update({
            status: 'active',
            plan_id: newPlanId,
            current_period_start: start,
            current_period_end: end,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            usage_reset_at: now.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)
      } else {
        console.log('🆕 Creating new subscription')
        await supabase.from('user_plans').insert({
          user_id: userId,
          plan_id: newPlanId,
          status: 'active',
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          current_period_start: start,
          current_period_end: end,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          usage_reset_at: now.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      console.log('✅ Successfully processed plan change for user:', userId)

      // ✅ SEND BILLING EMAIL (inside the payment success block, after user data is available)
      try {
        await sendBillingEmail(
          user.email,
          user.full_name || user.email?.split('@')[0] || 'User',
          newPlanId === 'starter' ? 'Starter' : 'Pro',
          newPlanId === 'starter' ? '9.00' : '19.00'
        );
        console.log('📧 Billing email sent to:', user.email);
      } catch (emailError) {
        console.error('❌ Failed to send billing email:', emailError);
      }
    }

    // =========================================================
    // 🔄 SUBSCRIPTION UPDATED
    // =========================================================
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any

      const start = safeDate(subscription.current_period_start) || new Date().toISOString()
      const end = safeDate(subscription.current_period_end) || fallbackEndDate()

      await supabase
        .from('user_plans')
        .update({
          status: subscription.status,
          current_period_start: start,
          current_period_end: end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id)
    }

    // =========================================================
    // ❌ SUBSCRIPTION DELETED (Downgrade to Free)
    // =========================================================
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any

      const { data: existing } = await supabase
        .from('user_plans')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (existing) {
        const userId = existing.user_id

        // Mark old as canceled
        await supabase
          .from('user_plans')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        // Reset usage for downgrade to free
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        
        await supabase
          .from('usage_tracking')
          .delete()
          .eq('user_id', userId)
          .eq('month', startOfMonth.toISOString().split('T')[0])
        
        await supabase
          .from('usage_tracking')
          .insert({
            user_id: userId,
            month: startOfMonth.toISOString().split('T')[0],
            ebook_generations_used: 0,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })

        // Check if free plan already exists
        const { data: freePlan } = await supabase
          .from('user_plans')
          .select('id')
          .eq('user_id', userId)
          .eq('plan_id', 'free')
          .eq('status', 'active')
          .single()

        if (!freePlan) {
          await supabase.from('user_plans').insert({
            user_id: userId,
            plan_id: 'free',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: fallbackEndDate(),
            cancel_at_period_end: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          console.log('🔻 Downgraded user to free plan with reset usage:', userId)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('❌ Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}