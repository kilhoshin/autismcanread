import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Role client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }
    
    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (userError) {
      console.error('❌ Error fetching user:', userError)
      return NextResponse.json({ 
        error: 'User not found',
        details: userError.message 
      }, { status: 404 })
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        subscription_status: user.subscription_status,
        subscription_period_end: user.subscription_period_end,
        monthly_worksheet_count: user.monthly_worksheet_count,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })
    
  } catch (error) {
    console.error('❌ Debug subscription error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
