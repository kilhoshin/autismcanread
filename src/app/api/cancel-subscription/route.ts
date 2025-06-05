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
  console.log('🚫 CANCEL SUBSCRIPTION API CALLED')
  
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
    
    // Cancel subscription in Stripe if it exists
    if (user.stripe_subscription_id) {
      try {
        console.log('🔄 Setting subscription to cancel at period end...')
        // 🎯 Key Fix: Don't cancel immediately, set to cancel at period end
        const updatedSubscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
          cancel_at_period_end: true
        })
        console.log('✅ Stripe subscription set to cancel at period end:', {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          current_period_end: new Date((updatedSubscription as any).current_period_end * 1000).toISOString()
        })
      } catch (stripeError: any) {
        console.error('❌ Failed to update Stripe subscription:', stripeError.message)
        // Continue with database update even if Stripe update fails
      }
    }
    
    // Update user subscription status to cancelled
    // Keep the current period end so user retains access until billing period expires
    const currentPeriodEnd = user.subscription_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        subscription_status: 'cancelled',
        subscription_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('❌ Failed to update user subscription:', updateError)
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
    }
    
    console.log('✅ Subscription cancelled successfully for user:', userId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      subscription_status: 'cancelled',
      subscription_period_end: currentPeriodEnd
    })
    
  } catch (error) {
    console.error('❌ Cancel subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
