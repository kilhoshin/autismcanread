'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ArrowLeft, Star, Download, FileText, Users, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Pricing() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState('')

  // Check if user has cancelled subscription with remaining period
  const canReactivate = profile?.cancel_at_period_end && 
    profile?.subscription_status === 'premium' &&
    profile?.subscription_period_end && 
    new Date(profile.subscription_period_end) > new Date()

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading(priceId)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading('')
    }
  }

  const handleReactivate = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setIsLoading('reactivate')

    try {
      const response = await fetch('/api/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Subscription reactivated:', result)
        
        // 🎯 Key Fix: Refresh profile data immediately
        await refreshProfile()
        
        // Small delay to ensure state update, then redirect
        setTimeout(() => {
          router.push('/dashboard?reactivated=true')
        }, 500)
      } else {
        const error = await response.json()
        alert(`Failed to reactivate subscription: ${error.error}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to reactivate subscription. Please try again.')
    } finally {
      setIsLoading('')
    }
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      priceId: 'free',
      features: [
        'Generate up to 30 worksheets per month',
        'Preview all worksheets',
        'Basic reading activities',
        'Community support',
      ],
      limitations: [
        'No PDF downloads',
        'Limited worksheet types',
        'Basic customization',
      ],
      buttonText: 'Current Plan',
      popular: false,
    },
    {
      name: 'Premium',
      price: '$5.00',
      period: 'per month',
      priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
      features: [
        'Unlimited worksheet generation',
        'Full PDF download access',
        'All worksheet types',
        'Advanced customization',
        'Progress tracking',
        'Priority support',
        'Printable materials',
        'Custom difficulty levels',
      ],
      limitations: [],
      buttonText: 'Upgrade Now',
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
            <p className="text-xl text-gray-600">
              Select the perfect plan for your educational needs
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Generate up to 30 worksheets per month
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Preview all worksheets
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Access to basic activities
              </li>
              <li className="flex items-center text-red-500">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
                No PDF downloads
              </li>
            </ul>
            
            <button className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold cursor-default">
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl border-2 border-blue-200 p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">$5.00</span>
                <span className="text-gray-600">/month</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Unlimited worksheet generation
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Full PDF downloads with answer keys
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Access to all activity types
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Priority support
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                New features early access
              </li>
            </ul>
            
            {canReactivate ? (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-blue-700 text-sm">
                    <strong>Good news!</strong> You still have {Math.ceil((new Date(profile.subscription_period_end!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left in your current billing period.
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Reactivate now to restore recurring billing without additional charges.
                  </p>
                </div>
                <button 
                  onClick={handleReactivate}
                  disabled={isLoading === 'reactivate'}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  {isLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate Subscription '}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  const premiumPriceId = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;
                  console.log(' Debug - Premium Price ID from env:', premiumPriceId);
                  console.log(' Debug - All NEXT_PUBLIC env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
                  
                  if (premiumPriceId) {
                    console.log(' Calling handleSubscribe with Price ID:', premiumPriceId);
                    handleSubscribe(premiumPriceId);
                  } else {
                    console.error(' Stripe Premium Price ID is not configured in environment variables.');
                    console.error('Available env vars:', process.env);
                    // Optionally, display a user-friendly message, e.g., using a toast notification or alert
                    alert('The subscription service is temporarily unavailable. Please check back later.');
                  }
                }}
                disabled={isLoading !== ''}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Processing...' : 'Start Premium'}
              </button>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal through our secure Stripe payment processing.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! The free plan allows you to generate and preview up to 30 worksheets per month to try our service.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-3">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600">
                Absolutely! You can change your plan at any time. Changes will be prorated and reflected in your next billing cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
