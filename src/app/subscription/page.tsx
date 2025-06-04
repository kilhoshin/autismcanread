'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Crown, Calendar, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
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
      // Mock data for demonstration
      next_billing_date: '2025-07-03',
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
        alert('구독이 취소되었습니다. 현재 결제 기간이 끝날 때까지 Premium 기능을 계속 이용하실 수 있습니다.')
        setShowCancelModal(false)
        fetchSubscriptionData()
      } else {
        throw new Error('구독 취소에 실패했습니다.')
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert('구독 취소 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
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
  const nextBillingDate = new Date(subscriptionData.next_billing_date).toLocaleDateString('ko-KR')

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
            대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">구독 관리</h1>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Crown className={`w-6 h-6 mr-3 ${hasActiveAccess ? 'text-yellow-500' : 'text-gray-400'}`} />
              <div>
                <h2 className="text-xl font-semibold">
                  {hasActiveAccess ? (isCancelled ? 'Premium 플랜 (취소됨)' : 'Premium 플랜') : 'Free 플랜'}
                </h2>
                <p className="text-gray-600">
                  {hasActiveAccess ? '무제한 워크시트 생성 및 PDF 다운로드' : '월 3개 워크시트 제한'}
                </p>
                {isCancelled && (
                  <p className="text-orange-600 text-sm mt-1">
                    구독이 취소되었지만 {nextBillingDate}까지 Premium 기능을 계속 이용하실 수 있습니다.
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              {hasActiveAccess && (
                <>
                  <p className="text-2xl font-bold text-green-600">${subscriptionData.amount}</p>
                  <p className="text-sm text-gray-500">월간 구독</p>
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
                    <p className="font-medium">{isCancelled ? '서비스 종료일' : '다음 결제일'}</p>
                    <p className="text-sm text-gray-600">{nextBillingDate}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Crown className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium">가입일</p>
                    <p className="text-sm text-gray-600">
                      {new Date(subscriptionData.created_at).toLocaleDateString('ko-KR')}
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
            <h3 className="text-lg font-semibold mb-4">구독 관리</h3>
            
            {/* Important Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">구독 취소 안내</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    구독을 취소하더라도 현재 결제 기간({nextBillingDate}까지)이 끝날 때까지 
                    Premium 기능을 계속 이용하실 수 있습니다. 이미 결제하신 5달러는 환불되지 않습니다.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              구독 취소
            </button>
          </div>
        ) : isCancelled ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">취소된 구독</h3>
            
            {/* Cancelled Subscription Notice */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-orange-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800">구독 취소됨</h4>
                  <p className="text-orange-700 text-sm mt-1">
                    구독이 취소되었습니다. {nextBillingDate}까지 Premium 기능을 계속 이용하실 수 있으며, 
                    그 이후에는 Free 플랜으로 전환됩니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/pricing"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block mr-4"
              >
                다시 구독하기
              </Link>
              <p className="text-sm text-gray-600">
                Premium 기능이 필요하시면 언제든지 다시 구독하실 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Premium으로 업그레이드</h3>
            <p className="text-gray-600 mb-4">
              Premium 플랜으로 업그레이드하여 무제한 워크시트 생성과 PDF 다운로드를 이용하세요.
            </p>
            <Link
              href="/pricing"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Premium 구독하기
            </Link>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">구독 취소 확인</h3>
              <p className="text-gray-600 mb-6">
                정말로 Premium 구독을 취소하시겠습니까?<br />
                <br />
                <strong>취소 후에도 {nextBillingDate}까지는 Premium 기능을 계속 이용하실 수 있습니다.</strong>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '처리 중...' : '구독 취소'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
