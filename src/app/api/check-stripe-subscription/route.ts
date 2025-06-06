import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🔍 CHECKING STRIPE SUBSCRIPTION STATUS')
  
  try {
    const { userId } = await request.json()
    console.log('👤 User ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('👤 Found user:', user.email)
    console.log('🔑 Stripe subscription ID:', user.stripe_subscription_id)
    
    let stripeSubscription = null
    if (user.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
        console.log('📊 Stripe subscription retrieved:', {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
          cancel_at: stripeSubscription.cancel_at ? new Date(stripeSubscription.cancel_at * 1000).toISOString() : null,
          canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : null
        })
      } catch (stripeError: any) {
        console.error('❌ Failed to retrieve Stripe subscription:', stripeError.message)
      }
    }
    
    return NextResponse.json({ 
      success: true,
      database: {
        subscription_status: user.subscription_status,
        subscription_period_end: user.subscription_period_end,
        stripe_subscription_id: user.stripe_subscription_id,
        stripe_customer_id: user.stripe_customer_id
      },
      stripe: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
        cancel_at: stripeSubscription.cancel_at ? new Date(stripeSubscription.cancel_at * 1000).toISOString() : null,
        canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : null
      } : null
    })
    
  } catch (error) {
    console.error('❌ Check stripe subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
