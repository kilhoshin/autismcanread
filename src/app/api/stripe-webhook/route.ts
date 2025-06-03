import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabase } from '@/utils/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)
        
        if (session.mode === 'subscription' && session.metadata?.userId) {
          // Update user subscription status to premium
          const { error } = await supabase
            .from('users')
            .update({ 
              subscription_status: 'premium',
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.userId)

          if (error) {
            console.error('Error updating user subscription:', error)
          } else {
            console.log(`Updated subscription for user ${session.metadata.userId}`)
          }
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', subscription.id)
        
        // Handle subscription status changes
        if (subscription.metadata?.userId) {
          let status = 'free'
          if (subscription.status === 'active') {
            status = 'premium'
          } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
            status = 'free'
          }

          const { error } = await supabase
            .from('users')
            .update({ 
              subscription_status: status,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.metadata.userId)

          if (error) {
            console.error('Error updating subscription status:', error)
          }
        }
        break

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', deletedSub.id)
        
        if (deletedSub.metadata?.userId) {
          const { error } = await supabase
            .from('users')
            .update({ 
              subscription_status: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', deletedSub.metadata.userId)

          if (error) {
            console.error('Error updating subscription to free:', error)
          }
        }
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
