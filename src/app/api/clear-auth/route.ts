import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // Sign out to clear any server-side session
    await supabase.auth.signOut()
    
    const response = NextResponse.json({
      success: true,
      message: 'Auth cleared successfully',
      timestamp: new Date().toISOString()
    })
    
    // Clear any auth-related cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('supabase-auth-token')
    response.cookies.delete('supabase.auth.token')
    
    return response
  } catch (error) {
    console.error('Error clearing auth:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear auth',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
