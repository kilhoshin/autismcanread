import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

// Service Role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🔔 STRIPE WEBHOOK CALLED')
  
  try {
    const body = await request.text()
    console.log('📊 Body length:', body.length)
    
    // Parse the event
    let event: Stripe.Event
    try {
      event = JSON.parse(body)
      console.log('📋 Event type:', event.type)
    } catch (error) {
      console.error('❌ Invalid JSON:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('💳 Checkout session completed:', session.id)
      console.log('👤 Customer ID:', session.customer)
      console.log('📧 Customer email:', session.customer_details?.email)
      
      // Get customer email
      const customerEmail = session.customer_details?.email
      if (!customerEmail) {
        console.error('❌ No customer email found')
        return NextResponse.json({ error: 'No customer email' }, { status: 400 })
      }
      
      // Find user by email and update subscription
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', customerEmail)
        .single()
      
      if (userError || !user) {
        console.error('❌ User not found:', userError)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      console.log('👤 Found user:', user.id)
      
      // Update subscription status
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          subscription_status: 'premium',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('❌ Update failed:', updateError)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
      }
      
      console.log('✅ Subscription updated for user:', user.id)
    } else {
      console.log('ℹ️ Unhandled event type:', event.type)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed',
      eventType: event.type,
      timestamp: new Date().toISOString() 
    })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Stripe webhook endpoint working' })
}
