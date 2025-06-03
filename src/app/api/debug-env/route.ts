import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables (without exposing secrets)
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      // Partial values for debugging (only first few characters)
      SUPABASE_URL_PARTIAL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      APP_URL_PARTIAL: process.env.NEXT_PUBLIC_APP_URL?.substring(0, 30) + '...',
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString(),
      deployment: {
        vercel: !!process.env.VERCEL,
        vercelUrl: process.env.VERCEL_URL ? process.env.VERCEL_URL.substring(0, 30) + '...' : null,
      }
    })
  } catch (error) {
    console.error('Error checking environment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Environment check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
