import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('🔍 Checking subscription for user:', userId)

    // Fetch user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('❌ Error fetching user:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('📊 User subscription status:', user.subscription_status)
    console.log('📊 Stripe customer ID:', user.stripe_customer_id)
    console.log('📊 Stripe subscription ID:', user.stripe_subscription_id)

    return NextResponse.json({ 
      subscription_status: user.subscription_status,
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      updated_at: user.updated_at
    })
  } catch (error) {
    console.error('❌ Error checking subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
