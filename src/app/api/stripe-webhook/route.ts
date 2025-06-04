import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔔 WEBHOOK CALLED - SIMPLE VERSION')
  
  try {
    const body = await request.text()
    console.log('📊 Body length:', body.length)
    console.log('📊 Headers:', Object.fromEntries(request.headers.entries()))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received',
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    console.error('❌ Simple webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Stripe webhook endpoint working' })
}
