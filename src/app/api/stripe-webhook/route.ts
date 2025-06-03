import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Check if Stripe is properly configured
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_...') {
  console.warn('Stripe not configured - webhooks will not work')
}

const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_...' 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    })
  : null

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET !== 'whsec_...' 
  ? process.env.STRIPE_WEBHOOK_SECRET 
  : null

// Create admin client with service role key for webhook operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received at:', new Date().toISOString())
  
  // Return early if Stripe is not configured
  if (!stripe || !endpointSecret) {
    console.error('❌ Stripe or webhook secret not configured')
    return NextResponse.json(
      { error: 'Webhook system not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  console.log('🔍 Webhook body length:', body.length)
  console.log('🔍 Stripe signature present:', !!sig)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
    console.log('✅ Webhook signature verified successfully')
    console.log('📋 Event type:', event.type)
    console.log('📋 Event ID:', event.id)
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('🛒 Checkout session completed:', session.id)
        console.log('🛒 Session mode:', session.mode)
        console.log('🛒 Session metadata:', session.metadata)
        console.log('🛒 Customer ID:', session.customer)
        
        if (session.mode === 'subscription' && session.metadata?.userId) {
          console.log('💳 Processing subscription for user:', session.metadata.userId)
          
          // Update user subscription status to premium
          const { error } = await supabaseAdmin
            .from('users')
            .update({ 
              subscription_status: 'premium',
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.userId)

          if (error) {
            console.error('❌ Error updating user subscription:', error)
          } else {
            console.log(`✅ Updated subscription for user ${session.metadata.userId} to PREMIUM`)
          }
        } else {
          console.log('⚠️ Skipping subscription update - not a subscription or no userId in metadata')
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔄 Subscription updated:', subscription.id)
        console.log('🔄 Subscription status:', subscription.status)
        console.log('🔄 Subscription metadata:', subscription.metadata)
        
        // Handle subscription status changes
        if (subscription.metadata?.userId) {
          let status = 'free'
          if (subscription.status === 'active') {
            status = 'premium'
          } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
            status = 'free'
          }

          console.log(`🔄 Updating user ${subscription.metadata.userId} to status: ${status}`)

          const { error } = await supabaseAdmin
            .from('users')
            .update({ 
              subscription_status: status,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.metadata.userId)

          if (error) {
            console.error('❌ Error updating subscription status:', error)
          } else {
            console.log(`✅ Successfully updated subscription status to ${status}`)
          }
        } else {
          console.log('⚠️ No userId in subscription metadata')
        }
        break

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription
        console.log('🗑️ Subscription deleted:', deletedSub.id)
        
        if (deletedSub.metadata?.userId) {
          console.log(`🗑️ Setting user ${deletedSub.metadata.userId} to free status`)
          
          const { error } = await supabaseAdmin
            .from('users')
            .update({ 
              subscription_status: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', deletedSub.metadata.userId)

          if (error) {
            console.error('❌ Error updating subscription to free:', error)
          } else {
            console.log('✅ Successfully updated subscription to free')
          }
        }
        break

      default:
        console.log(`❓ Unhandled event type: ${event.type}`)
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
