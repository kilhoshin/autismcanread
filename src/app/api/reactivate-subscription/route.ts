import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      console.error('❌ Missing userId in request')
      return NextResponse.json(
        { error: 'User ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    console.log('🔄 Reactivating subscription for user:', userId)

    // First check if user has a cancelled subscription with remaining period
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('subscription_status, subscription_period_end, stripe_customer_id, stripe_subscription_id, email')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch user data:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: fetchError.message },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    if (!userData) {
      console.error('❌ User not found for ID:', userId)
      return NextResponse.json(
        { error: 'User not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      )
    }

    console.log(' User data:', {
      email: userData.email,
      subscription_status: userData.subscription_status,
      stripe_subscription_id: userData.stripe_subscription_id
    })

    // Check if subscription is cancelled and has remaining period
    if (userData.subscription_status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is not in cancelled state' },
        { status: 400 }
      )
    }

    if (!userData.subscription_period_end) {
      return NextResponse.json(
        { error: 'No subscription period end date found' },
        { status: 400 }
      )
    }

    const now = new Date()
    const periodEnd = new Date(userData.subscription_period_end)

    if (now > periodEnd) {
      return NextResponse.json(
        { error: 'Subscription period has already expired. Please purchase a new subscription.' },
        { status: 400 }
      )
    }

    // Key Fix: Reactivate Stripe subscription first
    let stripeReactivated = false
    if (userData.stripe_subscription_id) {
      try {
        console.log(' Reactivating Stripe subscription:', userData.stripe_subscription_id)
        
        // Try to reactivate the subscription
        const subscription = await stripe.subscriptions.update(userData.stripe_subscription_id, {
          cancel_at_period_end: false
        })
        
        console.log(' Stripe subscription reactivated:', {
          id: subscription.id,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end
        })
        
        stripeReactivated = true
      } catch (stripeError: any) {
        console.error(' Failed to reactivate Stripe subscription:', stripeError.message)
        
        // If subscription is deleted in Stripe, we need to create a new one
        if (stripeError.code === 'resource_missing') {
          console.log(' Subscription deleted in Stripe, user needs to create new subscription')
          return NextResponse.json(
            { error: 'Your subscription has been permanently canceled. Please purchase a new subscription.' },
            { status: 400 }
          )
        }
        
        // For other errors, continue with database update but warn
        console.warn(' Continuing with database update despite Stripe error')
      }
    }

    // Update user subscription status to active (premium)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        subscription_status: 'premium',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error(' Failed to reactivate subscription in database:', updateError)
      return NextResponse.json(
        { error: 'Failed to reactivate subscription' },
        { status: 500 }
      )
    }

    console.log(' Subscription reactivated successfully!')
    console.log(' Billing period maintained until:', userData.subscription_period_end)
    console.log(' Stripe reactivated:', stripeReactivated)

    return NextResponse.json({ 
      success: true,
      message: 'Subscription reactivated successfully',
      periodEnd: userData.subscription_period_end,
      stripeReactivated,
      redirect_url: `/dashboard?reactivated=true`
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('❌ Reactivate subscription error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
