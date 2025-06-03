import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role client to bypass RLS
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

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName } = await request.json()
    
    console.log(' Creating user record:')
    console.log('  - User ID:', userId)
    console.log('  - Email:', email)
    console.log('  - Full Name:', fullName)

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      console.log(' User already exists')
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        existed: true
      })
    }

    // Create user record
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        subscription_status: 'free',
        monthly_worksheets_generated: 0
      })
      .select()

    if (error) {
      console.error(' Error creating user:', error)
      console.error(' Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Failed to create user record',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log(' Successfully created user record:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'User record created successfully',
      data: data
    })
  } catch (error) {
    console.error(' Error in create user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
