import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscriptionStatus } = await request.json()
    
    console.log('🔄 Manual subscription update request:')
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

    // Update user subscription status
    const { error } = await supabase
      .from('users')
      .update({ 
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('❌ Error updating subscription status:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      )
    }

    console.log(`✅ Successfully updated user ${userId} to ${subscriptionStatus}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Subscription updated to ${subscriptionStatus}` 
    })
  } catch (error) {
    console.error('❌ Error in manual subscription update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
