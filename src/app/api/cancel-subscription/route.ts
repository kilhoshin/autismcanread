import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('🚫 Cancel subscription request for user:', userId)

    // Get user data to find Stripe customer ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For now, we'll just update the subscription status to 'cancelled'
    // In a real implementation, you would:
    // 1. Find the Stripe subscription ID for this customer
    // 2. Cancel the subscription via Stripe API
    // 3. Let the webhook handle the status update

    // For testing, set period end to next month to simulate remaining billing period
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const periodEnd = nextMonth.toISOString()

    // Update subscription status to cancelled but maintain period end
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        subscription_status: 'cancelled',
        subscription_period_end: periodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ Failed to update subscription status:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }

    console.log('✅ Subscription cancelled for user:', userId)

    return NextResponse.json({ 
      success: true,
      message: 'Subscription cancelled successfully' 
    })

  } catch (error) {
    console.error('❌ Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
