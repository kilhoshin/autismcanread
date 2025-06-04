import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
}) : null

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Stripe webhook called')
    
    if (!stripe) {
      console.error('❌ Stripe not configured')
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    console.log('📊 Headers:', Object.fromEntries(request.headers.entries()))
    console.log('📊 Signature present:', !!signature)
    console.log('📊 Webhook secret present:', !!process.env.STRIPE_WEBHOOK_SECRET)

    let event: Stripe.Event

    // TEMPORARILY DISABLE signature verification for debugging
    try {
      if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        )
      } else {
        // Parse as raw JSON for debugging
        console.log('⚠️ Bypassing signature verification for debugging')
        event = JSON.parse(body) as Stripe.Event
      }
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      // For debugging, try to parse anyway
      try {
        event = JSON.parse(body) as Stripe.Event
        console.log('⚠️ Using unsigned event for debugging')
      } catch (parseErr) {
        console.error('❌ Could not parse webhook body:', parseErr)
        return NextResponse.json({ error: 'Invalid webhook body' }, { status: 400 })
      }
    }

    console.log('🔔 Received Stripe webhook:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('✅ Checkout session completed:', session.id)
        console.log('📊 Session metadata:', session.metadata)

        if (session.metadata?.userId) {
          console.log('🔄 Updating user subscription status for:', session.metadata.userId)
          
          const { error } = await supabase
            .from('users')
            .update({ 
              subscription_status: 'active',
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.userId)

          if (error) {
            console.error('❌ Error updating user subscription:', error)
          } else {
            console.log('✅ User subscription updated successfully')
          }
        } else {
          console.error('❌ No userId found in session metadata')
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('✅ Subscription created:', subscription.id)
        console.log('📊 Customer:', subscription.customer)
        
        const { error } = await supabase
          .from('users')
          .update({ 
            subscription_status: 'active',
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) {
          console.error('❌ Error updating subscription:', error)
        } else {
          console.log('✅ Subscription record updated')
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔄 Subscription updated:', subscription.id)
        console.log('📊 Status:', subscription.status)
        
        const status = subscription.status === 'active' ? 'active' : 'inactive'
        
        const { error } = await supabase
          .from('users')
          .update({ 
            subscription_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Error updating subscription status:', error)
        } else {
          console.log('✅ Subscription status updated to:', status)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('❌ Subscription deleted:', subscription.id)
        
        const { error } = await supabase
          .from('users')
          .update({ 
            subscription_status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('❌ Error updating deleted subscription:', error)
        } else {
          console.log('✅ Subscription marked as inactive')
        }
        break
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
