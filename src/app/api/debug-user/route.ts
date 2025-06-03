import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || '674f43fd-abb0-45b7-b45a-34783f98017d' // Default to your user ID

    console.log(' Debug API - User ID:', userId)

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

    // Get user data from users table using admin client
    const { data: userData, error: userError, count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .eq('id', userId)

    console.log(' Debug results:')
    console.log('  - User count:', count)
    console.log('  - User data:', userData)
    console.log('  - User error:', userError)

    // Also get auth user data
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    return NextResponse.json({
      userId: userId,
      userData: userData,
      userCount: count,
      authUser: authData?.user ? {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      } : null,
      errors: {
        userError: userError?.message,
        authError: authError?.message
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error(' Debug API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
