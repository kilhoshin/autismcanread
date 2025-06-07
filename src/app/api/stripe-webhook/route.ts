import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Stripe as StripeType } from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

// Service Role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log(' STRIPE WEBHOOK CALLED')
  
  try {
    const body = await request.text()
    console.log(' Body length:', body.length)
    
    // Parse the event
    let event: StripeType.Event
    try {
      event = JSON.parse(body)
      console.log(' Event type:', event.type)
    } catch (error) {
      console.error(' Invalid JSON:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    // Handle different subscription events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as StripeType.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as StripeType.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as StripeType.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as StripeType.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as StripeType.Invoice)
        break
        
      default:
        console.log(' Unhandled event type:', event.type)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed',
      eventType: event.type,
      timestamp: new Date().toISOString() 
    })
    
  } catch (error) {
    console.error(' Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

// Handle checkout completion - new subscription
async function handleCheckoutCompleted(session: StripeType.Checkout.Session) {
  console.log(' Checkout session completed:', session.id)
  console.log(' Customer ID:', session.customer)
  console.log(' Customer email:', session.customer_details?.email)
  
  const customerEmail = session.customer_details?.email
  if (!customerEmail) {
    console.error(' No customer email found')
    return
  }
  
  // Find user by email
  console.log('🔍 Looking for user with email:', customerEmail)
  
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', customerEmail)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found with email:', customerEmail)
    
    // Try to find similar emails for debugging
    const { data: allUsers, error: debugError } = await supabaseAdmin
      .from('users')
      .select('email')
      .limit(10)
    
    if (!debugError && allUsers) {
      console.log('📋 Available emails in database:', allUsers.map(u => u.email))
    }
    
    return
  }
  
  console.log('✅ Found user:', user.id, 'with email:', user.email)
  
  // Get subscription details
  const subscription = session.subscription
  let subscriptionData = {}
  
  if (subscription && typeof subscription === 'string') {
    try {
      const subscriptionDetails = await stripe.subscriptions.retrieve(subscription)
      console.log('🔍 Raw subscription details:', {
        current_period_start: (subscriptionDetails as any).current_period_start,
        current_period_end: (subscriptionDetails as any).current_period_end,
        status: (subscriptionDetails as any).status,
        billing_cycle_anchor: (subscriptionDetails as any).billing_cycle_anchor,
        created: (subscriptionDetails as any).created
      })
      
      // Safely handle current_period_end timestamp
      let periodEndISOString = null
      const currentPeriodEnd = (subscriptionDetails as any).current_period_end
      const currentPeriodStart = (subscriptionDetails as any).current_period_start
      
      if (currentPeriodEnd && typeof currentPeriodEnd === 'number') {
        const periodEndDate = new Date(currentPeriodEnd * 1000)
        const periodStartDate = new Date(currentPeriodStart * 1000)
        
        console.log('📅 Billing period:', {
          start: periodStartDate.toISOString(),
          end: periodEndDate.toISOString(),
          duration_days: Math.ceil((currentPeriodEnd - currentPeriodStart) / (60 * 60 * 24))
        })
        
        if (!isNaN(periodEndDate.getTime())) {
          periodEndISOString = periodEndDate.toISOString()
        } else {
          console.error('❌ Invalid current_period_end timestamp:', currentPeriodEnd)
        }
      }
      
      subscriptionData = {
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription,
        ...(periodEndISOString && { subscription_period_end: periodEndISOString })
      }
      console.log(' Processed subscription data:', subscriptionData)
    } catch (stripeError) {
      console.error(' Failed to fetch subscription details:', stripeError)
    }
  }
  
  // Update user to premium
  const updateData = { 
    subscription_status: 'premium' as const,
    updated_at: new Date().toISOString(),
    ...subscriptionData
  }
  
  console.log(' Updating user with data:', updateData)
  
  const { data: updatedUser, error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select()
  
  if (updateError) {
    console.error(' Update failed:', updateError)
    return
  }
  
  console.log(' User successfully upgraded to premium:', user.id)
  console.log(' Updated user data:', updatedUser)
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: StripeType.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)
  console.log('📊 Status:', subscription.status)
  console.log('🚫 Cancel at period end:', subscription.cancel_at_period_end)
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found for customer:', subscription.customer)
    return
  }
  
  console.log('✅ Found user:', user.id, 'for subscription update')
  
  // Handle different subscription states with cancel_at_period_end logic
  let status: 'free' | 'premium' | 'cancelled'
  let cancelAtPeriodEnd = false
  
  if (subscription.status === 'active') {
    if (subscription.cancel_at_period_end) {
      // Subscription is active but will be cancelled at period end
      status = 'premium'  // Keep premium until period ends
      cancelAtPeriodEnd = true
      console.log('⚠️ Subscription will be cancelled at period end, keeping premium access until then')
    } else {
      // Regular active subscription
      status = 'premium'
      cancelAtPeriodEnd = false
      console.log('✅ Active premium subscription')
    }
  } else if (subscription.status === 'canceled') {
    // Subscription has been fully cancelled/expired
    status = 'cancelled'
    cancelAtPeriodEnd = false
    console.log('🚫 Subscription fully cancelled')
  } else {
    // Other statuses (unpaid, past_due, etc.)
    status = 'free'
    cancelAtPeriodEnd = false
    console.log('📉 Subscription not active, setting to free')
  }
  
  const updateData = {
    subscription_status: status,
    cancel_at_period_end: cancelAtPeriodEnd,
    stripe_subscription_id: subscription.id,
    subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
  
  console.log('📝 Updating user with data:', updateData)
  
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.id)
  
  if (updateError) {
    console.error('❌ Failed to update subscription:', updateError)
    return
  }
  
  console.log('✅ Subscription updated for user:', user.id, 'Status:', status, 'Cancel at period end:', cancelAtPeriodEnd)
}

// Handle subscription deletion (cancellation)
async function handleSubscriptionDeleted(subscription: StripeType.Subscription) {
  console.log('🚫 Subscription deleted:', subscription.id)
  console.log('📊 Final status:', subscription.status)
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found for customer:', subscription.customer)
    return
  }
  
  console.log('✅ Found user:', user.id, 'for subscription deletion')
  
  // Set to cancelled and reset cancel_at_period_end flag since it's now actually cancelled
  const updateData = {
    subscription_status: 'cancelled' as const,
    cancel_at_period_end: false, // Reset flag since it's now actually cancelled
    subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
  
  console.log('📝 Updating user to cancelled status:', updateData)
  
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.id)
  
  if (updateError) {
    console.error('❌ Failed to update subscription cancellation:', updateError)
    return
  }
  
  console.log('✅ Subscription cancelled for user:', user.id)
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: StripeType.Invoice) {
  console.log('💳 Payment succeeded for subscription:', (invoice as any).subscription)
  
  if (!(invoice as any).subscription) return
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer as string)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found for customer:', invoice.customer)
    return
  }
  
  console.log('✅ Found user:', user.id, 'for payment success')
  
  // Ensure user is marked as premium and reset cancel flag (for recurring payments)
  const updateData = {
    subscription_status: 'premium' as const,
    cancel_at_period_end: false, // Reset cancel flag since payment succeeded
    updated_at: new Date().toISOString()
  }
  
  console.log('📝 Updating user for successful payment:', updateData)
  
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.id)
  
  if (updateError) {
    console.error(' Failed to update payment success:', updateError)
    return
  }
  
  console.log(' Payment processed for user:', user.id)
}

// Handle failed payment
async function handlePaymentFailed(invoice: StripeType.Invoice) {
  console.log('💔 Payment failed for subscription:', (invoice as any).subscription)
  
  if (!(invoice as any).subscription) return
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer as string)
    .single()
  
  if (userError || !user) {
    console.error('❌ User not found for customer:', invoice.customer)
    return
  }
  
  // Log payment failure - Stripe will handle retry logic
  // We don't immediately cancel the subscription as Stripe will retry
  console.log('⚠️ Payment failed for user:', user.id, '- Stripe will handle retries')
}

export async function GET() {
  return NextResponse.json({ message: 'Stripe webhook endpoint working' })
}
