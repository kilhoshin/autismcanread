import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test webhook called')
    console.log('📊 Method:', request.method)
    console.log('📊 URL:', request.url)
    console.log('📊 Headers:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.text()
    console.log('📊 Body length:', body.length)
    console.log('📊 Body preview:', body.substring(0, 200))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test webhook error:', error)
    return NextResponse.json({ error: 'Test webhook error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  })
}
