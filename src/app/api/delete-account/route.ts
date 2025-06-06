import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🚫 DELETE ACCOUNT API CALLED')
  
  try {
    const { userId } = await request.json()
    console.log('👤 User ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('👤 Found user:', user.email)
    console.log('🔑 Stripe subscription ID:', user.stripe_subscription_id)
    console.log('🔑 Stripe customer ID:', user.stripe_customer_id)
    
    // Step 1: Cancel active subscription immediately (if exists)
    if (user.stripe_subscription_id) {
      try {
        console.log('🔄 Cancelling Stripe subscription immediately...')
        const cancelledSubscription = await stripe.subscriptions.cancel(user.stripe_subscription_id)
        console.log('✅ Stripe subscription cancelled immediately:', {
          id: cancelledSubscription.id,
          status: cancelledSubscription.status,
          canceled_at: new Date((cancelledSubscription as any).canceled_at * 1000).toISOString()
        })
      } catch (stripeError: any) {
        console.error('❌ Failed to cancel Stripe subscription:', stripeError.message)
        // Continue with account deactivation even if Stripe cancellation fails
      }
    }
    
    // Step 2: Keep Stripe Customer for payment history preservation
    console.log('📋 Keeping Stripe Customer for payment history preservation')
    
    // Step 3: Deactivate user in database (soft delete)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: false,
        subscription_status: 'cancelled',
        subscription_period_end: new Date().toISOString(), // End immediately
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('❌ Failed to deactivate user in database:', updateError)
      return NextResponse.json({ error: 'Failed to deactivate account' }, { status: 500 })
    }
    
    console.log('✅ User deactivated in database')
    
    // Step 4: Disable user in Supabase Auth
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          is_active: false,
          deactivated_at: new Date().toISOString()
        },
        app_metadata: { 
          is_active: false 
        }
      })
      
      if (authError) {
        console.error('❌ Failed to deactivate user in auth:', authError)
        // Continue even if auth update fails
      } else {
        console.log('✅ User deactivated in Supabase Auth')
      }
    } catch (authError) {
      console.error('❌ Exception deactivating user in auth:', authError)
    }
    
    console.log('✅ Account deletion completed successfully for user:', userId)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully',
      details: {
        subscription_cancelled: !!user.stripe_subscription_id,
        customer_preserved: !!user.stripe_customer_id,
        account_deactivated: true
      }
    })
    
  } catch (error) {
    console.error('❌ Delete account error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
