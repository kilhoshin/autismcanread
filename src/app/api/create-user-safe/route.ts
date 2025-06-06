import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName, reading_level, writing_level } = await request.json()
    
    console.log('🔄 Safe user creation request:')
    console.log('  - User ID:', userId)
    console.log('  - Email:', email)
    console.log('  - Reading Level:', reading_level)
    console.log('  - Writing Level:', writing_level)

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
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

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle to avoid errors when no rows found

    if (existingUser) {
      console.log('✅ User already exists')
      return NextResponse.json({ 
        success: true, 
        message: 'User already exists',
        action: 'none'
      })
    }

    // Create user record using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        full_name: fullName || '',
        subscription_status: 'free',
        monthly_worksheets_generated: 0,
        reading_level: reading_level || 3,
        writing_level: writing_level || 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('❌ Error creating user:', error)
      return NextResponse.json(
        { 
          error: 'Failed to create user record',
          details: error.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Successfully created user record:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'User record created successfully',
      action: 'created',
      data: data
    })
  } catch (error) {
    console.error('❌ Error in safe user creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
