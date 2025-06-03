import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Check if Stripe is properly configured
if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_...') {
  console.warn('Stripe not configured - checkout will not work')
}

const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_...' 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    })
  : null

export async function POST(request: NextRequest) {
  try {
    // Return early if Stripe is not configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      )
    }

    const { priceId, userId } = await request.json()

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID and User ID are required' },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata: {
        userId: userId,
      },
      customer_email: undefined, // Will be filled by Stripe
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
