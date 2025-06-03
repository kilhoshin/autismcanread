import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionStatus } = await request.json()
    
    console.log(' Manual subscription update request:')
    console.log('  - User ID:', userId)
    console.log('  - New status:', subscriptionStatus)

    if (!userId || !subscriptionStatus) {
      return NextResponse.json(
        { error: 'User ID and subscription status are required' },
        { status: 400 }
      )
    }

    if (!['free', 'premium'].includes(subscriptionStatus)) {
      return NextResponse.json(
        { error: 'Invalid subscription status. Must be "free" or "premium"' },
        { status: 400 }
      )
    }

    // Create admin client with service role key
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

    // Update user subscription status using admin client
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error(' Error updating subscription status:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      )
    }

    // Verification step - read back the updated subscription_status
    console.log(' Verifying update...')
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .maybeSingle()

    if (verifyError) {
      console.error(' Error verifying update:', verifyError)
    } else if (verifyData) {
      console.log(' Verified subscription status:', verifyData.subscription_status)
    } else {
      console.log(' No user found during verification')
    }

    console.log(` Successfully updated user ${userId} to ${subscriptionStatus}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Subscription updated to ${subscriptionStatus}` 
    })
  } catch (error) {
    console.error(' Error in manual subscription update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
