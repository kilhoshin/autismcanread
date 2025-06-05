import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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
    let event: Stripe.Event
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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
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
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(' Checkout session completed:', session.id)
  console.log(' Customer ID:', session.customer)
  console.log(' Customer email:', session.customer_details?.email)
  
  const customerEmail = session.customer_details?.email
  if (!customerEmail) {
    console.error(' No customer email found')
    return
  }
  
  // Find user by email
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', customerEmail)
    .single()
  
  if (userError || !user) {
    console.error(' User not found:', userError)
    return
  }
  
  console.log(' Found user:', user.id)
  
  // Get subscription details
  const subscription = session.subscription
  let subscriptionData = {}
  
  if (subscription && typeof subscription === 'string') {
    try {
      const subscriptionDetails = await stripe.subscriptions.retrieve(subscription)
      console.log(' Raw subscription details:', {
        current_period_end: (subscriptionDetails as any).current_period_end,
        status: (subscriptionDetails as any).status
      })
      
      // Safely handle current_period_end timestamp
      let periodEndISOString = null
      const currentPeriodEnd = (subscriptionDetails as any).current_period_end
      if (currentPeriodEnd && typeof currentPeriodEnd === 'number') {
        const periodEndDate = new Date(currentPeriodEnd * 1000)
        if (!isNaN(periodEndDate.getTime())) {
          periodEndISOString = periodEndDate.toISOString()
        } else {
          console.error(' Invalid current_period_end timestamp:', currentPeriodEnd)
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
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(' Subscription updated:', subscription.id)
  console.log(' Status:', subscription.status)
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()
  
  if (userError || !user) {
    console.error(' User not found for customer:', subscription.customer)
    return
  }
  
  // Map Stripe status to our status
  let status: 'free' | 'premium' | 'cancelled'
  if (subscription.status === 'active') {
    status = 'premium'
  } else if (subscription.status === 'canceled') {
    status = 'cancelled'
  } else {
    status = 'free'
  }
  
  const updateData = {
    subscription_status: status,
    stripe_subscription_id: subscription.id,
    subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.id)
  
  if (updateError) {
    console.error(' Failed to update subscription:', updateError)
    return
  }
  
  console.log(' Subscription updated for user:', user.id, 'Status:', status)
}

// Handle subscription deletion (cancellation)
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(' Subscription deleted:', subscription.id)
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', subscription.customer as string)
    .single()
  
  if (userError || !user) {
    console.error(' User not found for customer:', subscription.customer)
    return
  }
  
  // Set to cancelled but keep period end for access until end of billing cycle
  const updateData = {
    subscription_status: 'cancelled' as const,
    subscription_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.id)
  
  if (updateError) {
    console.error(' Failed to update subscription cancellation:', updateError)
    return
  }
  
  console.log(' Subscription cancelled for user:', user.id)
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(' Payment succeeded for subscription:', (invoice as any).subscription)
  
  if (!(invoice as any).subscription) return
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer as string)
    .single()
  
  if (userError || !user) {
    console.error(' User not found for customer:', invoice.customer)
    return
  }
  
  // Ensure user is marked as premium (for recurring payments)
  const updateData = {
    subscription_status: 'premium' as const,
    updated_at: new Date().toISOString()
  }
  
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
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(' Payment failed for subscription:', (invoice as any).subscription)
  
  if (!(invoice as any).subscription) return
  
  // Find user by Stripe customer ID
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('stripe_customer_id', invoice.customer as string)
    .single()
  
  if (userError || !user) {
    console.error(' User not found for customer:', invoice.customer)
    return
  }
  
  // Could set to past_due or handle retry logic
  console.log(' Payment failed for user:', user.id)
}

export async function GET() {
  return NextResponse.json({ message: 'Stripe webhook endpoint working' })
}
