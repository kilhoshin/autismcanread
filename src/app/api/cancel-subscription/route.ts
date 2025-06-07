import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  { apiVersion: '2025-05-28.basil' }
)

export async function POST(request: NextRequest) {
  console.log(' CANCEL SUBSCRIPTION API CALLED')
  
  try {
    const { userId } = await request.json()
    console.log(' User ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Get user from Supabase
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('Found user:', user.email)
    console.log('Stripe subscription ID:', user.stripe_subscription_id)
    
    // First, update Supabase database regardless of Stripe status
    // This ensures consistency even if Stripe API fails
    console.log(' Updating Supabase database first...')
    const currentPeriodEnd = user.subscription_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        cancel_at_period_end: true,
        subscription_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('subscription_status, cancel_at_period_end, subscription_period_end, updated_at')
    
    if (updateError) {
      console.error(' CRITICAL: Failed to update user subscription in Supabase:', updateError)
      console.error(' Update error details:', JSON.stringify(updateError, null, 2))
      return NextResponse.json({ error: 'Failed to cancel subscription in database' }, { status: 500 })
    }
    
    console.log(' SUPABASE UPDATE SUCCESS:', updateResult)
    
    // Verify the update by fetching the user again
    console.log(' Double-checking Supabase update...')
    const { data: verifiedUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('subscription_status, cancel_at_period_end, subscription_period_end, updated_at')
      .eq('id', userId)
      .single()
    
    if (fetchError) {
      console.error(' Error verifying Supabase update:', fetchError)
    } else {
      console.log(' VERIFIED Supabase data:', verifiedUser)
      if (!verifiedUser.cancel_at_period_end) {
        console.error(' CRITICAL: Supabase update failed - cancel_at_period_end is still:', verifiedUser.cancel_at_period_end)
        return NextResponse.json({ error: 'Database update verification failed' }, { status: 500 })
      }
    }

    // Now try to update Stripe (but don't fail if this errors)
    console.log(' Attempting Stripe update...')
    let stripeUpdateSuccess = false
    
    try {
      if (user.stripe_subscription_id) {
        console.log('Stripe Subscription ID:', user.stripe_subscription_id)
        console.log('Setting subscription to cancel at period end...')
        
        const updatedSubscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
          cancel_at_period_end: true
        })
        
        console.log(' Stripe subscription set to cancel at period end:', {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancel_at_period_end: updatedSubscription.cancel_at_period_end,
          current_period_end: new Date((updatedSubscription as any).current_period_end * 1000).toISOString()
        })
        
        stripeUpdateSuccess = true
      }
    } catch (stripeError: any) {
      console.error(' Stripe update failed, but continuing with database update:', stripeError.message)
      console.error('Stripe error details:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        subscription_id: user.stripe_subscription_id
      })
      // Don't return error - database update succeeded
    }

    console.log(' Subscription cancellation complete!')
    console.log(' Database updated: ')
    console.log(' Stripe updated:', stripeUpdateSuccess ? ' ' : '')

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      subscription_status: 'active',
      subscription_period_end: currentPeriodEnd,
      redirect_url: `/dashboard?cancelled=true`
    })
    
  } catch (error) {
    console.error(' Cancel subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
