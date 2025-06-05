'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Crown, Calendar, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionPage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [successType, setSuccessType] = useState<'cancel' | 'reactivate'>('cancel')
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    // Load subscription data
    fetchSubscriptionData()
  }, [user, router])

  const fetchSubscriptionData = async () => {
    // This would fetch actual subscription data from Stripe
    // For now, using profile data
    setSubscriptionData({
      status: profile?.subscription_status || 'free',
      created_at: profile?.created_at,
      // Use actual subscription_period_end from database
      next_billing_date: profile?.subscription_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 5.00,
      currency: 'USD'
    })
  }

  const handleCancelSubscription = async () => {
    setLoading(true)
    try {
      // Call API to cancel Stripe subscription
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Cancel response:', result) // Debug log
        
        setSuccessMessage('Your subscription has been cancelled. You can continue to use Premium features until the end of your current billing period.')
        setSuccessType('cancel')
        setShowSuccessModal(true)
        fetchSubscriptionData()
        
        // Refresh user profile context to update subscription status immediately
        if (refreshProfile) {
          console.log('Refreshing profile context after subscription cancellation')
          await refreshProfile()
          console.log('🔍 Profile after refresh:', profile) // Debug log
          
          // Small delay to ensure state update, then refresh subscription data
          setTimeout(() => {
            fetchSubscriptionData()
          }, 500)
        }
      } else {
        throw new Error('Failed to cancel subscription.')
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert('An error occurred while cancelling your subscription. Please try again later.')
    }
    setLoading(false)
  }

  const handleReactivateSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage(`Your subscription has been reactivated! You can use Premium features until ${new Date(data.periodEnd).toLocaleDateString('en-US')}.`)
        setSuccessType('reactivate')
        setShowSuccessModal(true)
        fetchSubscriptionData()
        
        // Refresh user profile context to update subscription status immediately
        if (refreshProfile) {
          console.log('Refreshing profile context after subscription reactivation')
          await refreshProfile()
        }
      } else {
        if (data.error.includes('expired')) {
          alert('Your subscription period has expired. Please purchase a new subscription.')
          router.push('/pricing')
        } else {
          throw new Error(data.error || 'Failed to reactivate subscription.')
        }
      }
    } catch (error) {
      console.error('Reactivate subscription error:', error)
      alert('An error occurred while reactivating your subscription. Please try again later.')
    }
    setLoading(false)
  }

  if (!user || !subscriptionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isPremium = subscriptionData.status === 'premium'
  const isCancelled = subscriptionData.status === 'cancelled'
  const hasActiveAccess = isPremium || isCancelled // Both premium and cancelled users have access until period ends
  const nextBillingDate = new Date(subscriptionData.next_billing_date).toLocaleDateString('en-US')
  const isExpired = isCancelled && new Date(subscriptionData.next_billing_date) < new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Crown className={`w-6 h-6 mr-3 ${hasActiveAccess ? 'text-yellow-500' : 'text-gray-400'}`} />
              <div>
                <h2 className="text-xl font-semibold">
                  {hasActiveAccess ? (isCancelled ? 'Premium Plan (Cancelled)' : 'Premium Plan') : 'Free Plan'}
                </h2>
                <p className="text-gray-600">
                  {hasActiveAccess ? 'Unlimited worksheet creation and PDF downloads' : 'Limited to 3 worksheets per month'}
                </p>
                {isCancelled && (
                  <p className="text-orange-600 text-sm mt-1">
                    Your subscription has been cancelled, but you can continue using Premium features until {nextBillingDate}.
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              {hasActiveAccess && (
                <>
                  <p className="text-2xl font-bold text-green-600">${subscriptionData.amount}</p>
                  <p className="text-sm text-gray-500">Monthly subscription</p>
                </>
              )}
            </div>
          </div>

          {hasActiveAccess && (
            <div className="border-t pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium">{isCancelled ? 'Service End Date' : 'Next Billing Date'}</p>
                    <p className="text-sm text-gray-600">{nextBillingDate}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Crown className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium">Subscription Start Date</p>
                    <p className="text-sm text-gray-600">
                      {new Date(subscriptionData.created_at).toLocaleDateString('en-US')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Actions */}
        {isPremium ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Subscription Management</h3>
            
            {/* Important Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Cancellation Notice</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    If you cancel your subscription, you will still be able to use Premium features until the end of your current billing period ({nextBillingDate}). Your $5 payment will not be refunded.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        ) : isCancelled ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Cancelled Subscription</h3>
            
            {/* Cancelled Subscription Notice */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-orange-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">Subscription Cancelled</h4>
                  <p className="text-orange-700 text-sm mt-1">
                    Your subscription has been cancelled. You can continue using Premium features until {nextBillingDate}, after which you will be downgraded to the Free plan.
                  </p>
                </div>
              </div>
            </div>

            {isExpired ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Your subscription period has expired. To purchase a new subscription, please click the link below.
                </p>
                <Link
                  href="/pricing"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Purchase a New Subscription
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleReactivateSubscription}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block mr-4"
                >
                  {loading ? 'Processing...' : 'Reactivate Subscription'}
                </button>
                <p className="text-sm text-gray-600">
                  You can reactivate your subscription at any time to regain access to Premium features.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Upgrade to Premium</h3>
            <p className="text-gray-600 mb-4">
              Upgrade to the Premium plan to unlock unlimited worksheet creation and PDF downloads.
            </p>
            <Link
              href="/pricing"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Upgrade to Premium
            </Link>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Cancel Subscription Confirmation</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your Premium subscription?<br />
                <br />
                <strong>You will still be able to use Premium features until the end of your current billing period ({nextBillingDate}).</strong>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">{successType === 'cancel' ? 'Subscription Cancelled Successfully' : 'Subscription Reactivated Successfully'}</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/dashboard"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
