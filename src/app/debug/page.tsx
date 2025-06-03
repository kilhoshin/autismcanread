'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function DebugPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [testResults, setTestResults] = useState<any>({})

  const fetchDebugInfo = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/debug-user?userId=${user.id}`)
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Error fetching debug info:', error)
      setMessage('❌ Error fetching debug info')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEnvInfo = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug-env')
      const data = await response.json()
      setEnvInfo(data)
      setMessage('✅ Environment info loaded')
    } catch (error) {
      console.error('Error fetching env info:', error)
      setMessage('❌ Error fetching environment info')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSubscription = async (status: 'free' | 'premium') => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionStatus: status,
        }),
      })
      
      const result = await response.json()
      if (response.ok) {
        setMessage(`✅ Successfully updated subscription to ${status}`)
        await refreshProfile()
        await fetchDebugInfo()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating subscription:', error)
      setMessage('❌ Error updating subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const createUserRecord = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/create-user-safe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          fullName: user.user_metadata?.full_name || 'User',
        }),
      })
      
      const result = await response.json()
      if (response.ok) {
        setMessage(`✅ ${result.message}`)
        await refreshProfile()
        await fetchDebugInfo()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating user record:', error)
      setMessage('❌ Error creating user record')
    } finally {
      setIsLoading(false)
    }
  }

  const runTests = async () => {
    if (!user) return

    setIsLoading(true)
    const results: any = {}

    try {
      // Test 1: Debug API
      try {
        const debugResponse = await fetch(`/api/debug-user?userId=${user.id}`)
        results.debugApi = debugResponse.ok ? '✅ Working' : '❌ Failed'
      } catch {
        results.debugApi = '❌ Error'
      }

      // Test 2: Create User API
      try {
        const createResponse = await fetch('/api/create-user-safe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            fullName: 'Test User'
          })
        })
        results.createUserApi = createResponse.ok ? '✅ Working' : '❌ Failed'
      } catch {
        results.createUserApi = '❌ Error'
      }

      // Test 3: Update Subscription API
      try {
        const updateResponse = await fetch('/api/update-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            subscriptionStatus: 'free'
          })
        })
        results.updateSubscriptionApi = updateResponse.ok ? '✅ Working' : '❌ Failed'
      } catch {
        results.updateSubscriptionApi = '❌ Error'
      }

      setTestResults(results)
      setMessage('🧪 Tests completed')
    } catch (error) {
      setMessage('❌ Error running tests')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">🐛 Production Debug Dashboard</h1>
            
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">⚠️ Not Logged In</h2>
              <p className="mb-4">You are not currently logged in. Some features require authentication.</p>
              
              <div className="flex flex-wrap gap-3">
                <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                  🔐 Go to Login
                </a>
                <button
                  onClick={fetchEnvInfo}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : '🌎 Check Environment'}
                </button>
              </div>
            </div>

            {/* Environment Info (available without login) */}
            {envInfo && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">🌎 Environment Information</h2>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(envInfo, null, 2)}
                </pre>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm">{message}</p>
              </div>
            )}

            {/* Basic Navigation */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                🏠 Home
              </a>
              <a href="/pricing" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                💰 Pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🐛 Production Debug Dashboard</h1>
          
          {/* Environment Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Environment Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
              <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</div>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Current User Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Auth User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Profile Exists:</strong> {profile ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Subscription:</strong> {profile?.subscription_status || 'Unknown'}</div>
              <div><strong>Monthly Usage:</strong> {profile?.monthly_worksheets_generated || 0}</div>
              <div><strong>Created:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : '🧪 Run All Tests'}
            </button>
            
            <button
              onClick={fetchDebugInfo}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              🔍 Get Debug Info
            </button>
            
            <button
              onClick={createUserRecord}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              ➕ Create User Record
            </button>
            
            <button
              onClick={() => updateSubscription('premium')}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              👑 Set Premium
            </button>
            
            <button
              onClick={() => updateSubscription('free')}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              🆓 Set Free
            </button>

            <button
              onClick={refreshProfile}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              🔄 Refresh Profile
            </button>

            <button
              onClick={fetchEnvInfo}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              🌎 Get Environment Info
            </button>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">🧪 Test Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Debug API:</strong> {testResults.debugApi}</div>
                <div><strong>Create User API:</strong> {testResults.createUserApi}</div>
                <div><strong>Update Subscription API:</strong> {testResults.updateSubscriptionApi}</div>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm">{message}</p>
            </div>
          )}

          {/* Debug Info Display */}
          {debugInfo && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">🔍 Debug Information</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Environment Info Display */}
          {envInfo && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">🌎 Environment Information</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(envInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <a href="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              📊 Dashboard
            </a>
            <a href="/pricing" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              💰 Pricing
            </a>
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              🏠 Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
