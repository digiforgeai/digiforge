// app/api/paystack/checkout/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystack, isPaystackConfigured } from '@/lib/paystack/client'

export async function POST(request: Request) {
  try {
    // Check if Paystack is configured
    if (!isPaystackConfigured()) {
      console.error('❌ Paystack not configured. Missing API keys.')
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { planCode, planId } = await request.json()
    
    if (!planCode || !planId) {
      return NextResponse.json({ error: 'Missing plan information' }, { status: 400 })
    }
    
    console.log('📦 Processing checkout:', { userId: user.id, planId, planCode })
    
    // Get or create Paystack customer reference
    let customerCode
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('paystack_customer_code')
      .eq('id', user.id)
      .single()
    
    if (profile?.paystack_customer_code) {
      customerCode = profile.paystack_customer_code
      console.log('✅ Found existing customer:', customerCode)
    } else {
      // Create customer in Paystack
      try {
        const { data: customerData } = await paystack.post('/customer', {
          email: user.email,
          metadata: { supabase_user_id: user.id },
        })
        
        customerCode = customerData.data.customer_code
        
        await supabase
          .from('profiles')
          .update({ paystack_customer_code: customerCode })
          .eq('id', user.id)
        
        console.log('✅ Created new customer:', customerCode)
      } catch (customerError: any) {
        console.error('❌ Failed to create customer:', customerError.response?.data || customerError.message)
        return NextResponse.json(
          { error: 'Failed to create customer. Please try again.' },
          { status: 500 }
        )
      }
    }
    
    // Set amount based on plan (in pesewas/GHS)
    // 900 pesewas = 9 GHS, 1900 pesewas = 19 GHS
    const amount = planId === 'starter' ? 900 : 1900

    console.log('💰 Initializing transaction with:', {
  email: user.email,
  amount: amount,
  currency: 'GHS',
  plan: planCode,
  metadata: { user_id: user.id, plan_id: planId },
})

    // Initialize transaction with plan
    try {
      const { data } = await paystack.post('/transaction/initialize', {
        email: user.email,
        amount: amount,
        currency: 'GHS',
        plan: planCode,
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment_success=true`,
      })
      
      console.log('✅ Transaction initialized:', data.data.reference)
      
      return NextResponse.json({ 
        url: data.data.authorization_url,
        reference: data.data.reference,
      })
      
    } catch (txError: any) {
      console.error('❌ Failed to initialize transaction:', txError.response?.data || txError.message)
      return NextResponse.json(
        { error: 'Failed to initialize payment. Please try again.' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}