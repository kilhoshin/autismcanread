'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book, Mail, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/supabase'

export default function VerifyEmail() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const { user } = useAuth()

  const handleResendEmail = async () => {
    if (!user?.email) return
    
    setIsResending(true)
    setResendMessage('')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })
      
      if (error) {
        setResendMessage('Failed to resend email. Please try again.')
      } else {
        setResendMessage('Verification email sent! Please check your inbox.')
      }
    } catch (err) {
      setResendMessage('An unexpected error occurred. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">We've sent a verification link to your email address</p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100">
          <div className="text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-xl">
              <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Almost There!</h3>
              <p className="text-gray-600 text-sm">
                Please check your email and click the verification link to activate your account.
              </p>
            </div>

            {user?.email && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Verification email sent to:
                </p>
                <p className="font-semibold text-gray-900">{user.email}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Check your inbox (including spam/junk folder)</p>
                <p>• Click the verification link in the email</p>
                <p>• Return here to access your dashboard</p>
              </div>

              {resendMessage && (
                <div className={`px-4 py-3 rounded-lg text-sm ${
                  resendMessage.includes('sent') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {resendMessage}
                </div>
              )}

              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact us at{' '}
            <a href="mailto:kylo.sheen@gmail.com" className="text-blue-600 hover:text-blue-700">
              kylo.sheen@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
