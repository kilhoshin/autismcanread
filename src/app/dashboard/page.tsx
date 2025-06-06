'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Book, Download, History, Settings, LogOut, Plus, FileText, Eye, X, User, Crown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { canDownloadPDF, canGenerateWorksheets, incrementMonthlyUsage } from '@/utils/supabase'

function DashboardContent() {
  const { user, profile, signOut, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [customTopic, setCustomTopic] = useState('')
  const [worksheetCount, setWorksheetCount] = useState(1)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewData, setPreviewData] = useState<{ stories: any[], pdfBase64: string } | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [checkingPremium, setCheckingPremium] = useState(true)
  const [monthlyUsage, setMonthlyUsage] = useState(0)
  const [subscriptionError, setSubscriptionError] = useState(false)
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false)
  const [showReactivatedMessage, setShowReactivatedMessage] = useState(false)

  // Check premium status and monthly usage on mount
  useEffect(() => {
    const checkUserStatus = async () => {
      if (user?.id) {
        console.log('🔍 Checking user status for:', user.email)
        setCheckingPremium(true)
        
        try {
          console.log('📊 Checking premium status...')
          const premiumStatus = await canDownloadPDF(user.id)
          console.log('📊 Premium status:', premiumStatus)
          setIsPremium(premiumStatus)
          
          // Always check monthly usage (for both free and premium users)
          console.log('📊 Checking monthly usage...')
          const usageInfo = await canGenerateWorksheets(user.id, 0)
          console.log('📊 Monthly usage:', usageInfo.currentCount)
          setMonthlyUsage(usageInfo.currentCount)
          
          // Clear error state on successful load
          setSubscriptionError(false)
          
        } catch (error) {
          console.error('❌ Error checking user status:', error)
          // Set safe defaults on error
          setIsPremium(false)
          setMonthlyUsage(0)
          setSubscriptionError(true)
          
          // Retry after 2 seconds
          console.log('🔄 Retrying user status check in 2 seconds...')
          setTimeout(() => {
            checkUserStatus()
          }, 2000)
          return // Don't set checkingPremium to false if retrying
        }
      } else {
        console.log('❌ No user ID found for status check')
        setIsPremium(false)
        setMonthlyUsage(0)
      }
      
      console.log('✅ User status check complete')
      setCheckingPremium(false)
    }
    
    // Add a small delay to ensure user data is available
    if (user?.id) {
      checkUserStatus()
    } else if (user === null) {
      // User explicitly null (not logged in)
      setCheckingPremium(false)
    }
    // If user is undefined, keep checking
  }, [user?.id])

  // Refresh status when profile changes (subscription updated)
  useEffect(() => {
    if (profile?.subscription_status && user?.id) {
      console.log('🔄 Profile subscription changed:', profile.subscription_status)
      const checkUserStatus = async () => {
        try {
          const premiumStatus = await canDownloadPDF(user.id)
          setIsPremium(premiumStatus)
          
          const usageInfo = await canGenerateWorksheets(user.id, 0)
          setMonthlyUsage(usageInfo.currentCount)
          
          // Clear error state on successful load
          setSubscriptionError(false)
        } catch (error) {
          console.error('Error refreshing user status:', error)
          setSubscriptionError(true)
        }
      }
      checkUserStatus()
    }
  }, [profile?.subscription_status, user?.id])

  // Handle payment success
  useEffect(() => {
    const paymentSuccess = searchParams.get('success') || searchParams.get('paymentSuccess')
    if (paymentSuccess === 'true' && user?.id) {
      console.log('🎉 Payment successful detected, refreshing subscription status...')
      
      // Force refresh subscription status
      const forceRefreshSubscription = async () => {
        try {
          setCheckingPremium(true)
          
          // Wait a moment for webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          console.log('🔄 Force checking premium status after payment...')
          const premiumStatus = await canDownloadPDF(user.id)
          console.log('📊 Updated premium status:', premiumStatus)
          setIsPremium(premiumStatus)
          
          const usageInfo = await canGenerateWorksheets(user.id, 0)
          console.log('📊 Updated monthly usage:', usageInfo.currentCount)
          setMonthlyUsage(usageInfo.currentCount)
          
          // Also refresh profile to get latest subscription_status
          await refreshProfile()
          
          setSubscriptionError(false)
          setCheckingPremium(false)
          
          console.log('✅ Subscription status refresh complete')
        } catch (error) {
          console.error('❌ Error refreshing subscription after payment:', error)
          setSubscriptionError(true)
          setCheckingPremium(false)
        }
      }
      
      forceRefreshSubscription()
      
      // Clean URL by removing success parameter
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('success')
      newUrl.searchParams.delete('paymentSuccess')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams, user?.id, refreshProfile])

  // Check for reactivated parameter
  useEffect(() => {
    const reactivated = searchParams.get('reactivated')
    if (reactivated === 'true') {
      setShowReactivatedMessage(true)
      // Clear the parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Hide message after 5 seconds
      setTimeout(() => {
        setShowReactivatedMessage(false)
      }, 5000)
    }
  }, [searchParams])

  // Show loading only while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (user === null) {
    router.push('/login')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // PDF 워크시트 생성 및 다운로드 함수
  const handleGenerateWorksheet = async () => {
    if (!isPremium) {
      // Free Plan users: Show preview instead of blocking
      console.log('🔄 Free Plan user redirected to preview mode')
      await handlePreviewWorksheet()
      return
    }

    if (selectedTopics.length === 0 || selectedActivities.length === 0) {
      alert('Please select at least one topic and one activity.')
      return
    }

    try {
      setIsGenerating(true)
      
      const requestBody = {
        topics: selectedTopics.includes('custom') && customTopic 
          ? [...selectedTopics.filter(t => t !== 'custom'), customTopic]
          : selectedTopics,
        activities: selectedActivities,
        count: worksheetCount,
        readingLevel: profile?.reading_level || 3,
        writingLevel: profile?.writing_level || 3,
        usePreviewData: showPreviewModal && previewData ? true : false,
        previewStoryData: showPreviewModal && previewData ? previewData.stories : null,
        userId: user?.id
      }

      console.log('Generating worksheet with:', requestBody)

      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle usage limit exceeded errors specifically
        if (response.status === 403 && errorData.upgrade_required) {
          alert(`${errorData.message}\n\nUpgrade to Premium for unlimited worksheets!`)
          return
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to generate worksheet')
      }

      console.log('📥 Received response, converting to blob...')
      const blob = await response.blob()
      console.log('📄 Blob created, size:', blob.size, 'type:', blob.type)
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file')
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `autism-can-read-worksheet-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      console.log('🔗 Download link created, triggering download...')
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log('📁 Download completed!')

      console.log('✅ Worksheet generated and downloaded successfully')

    } catch (error) {
      console.error('❌ Error generating worksheet:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate worksheet. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreviewWorksheet = async () => {
    if (!user?.id) {
      alert('Please sign in to generate worksheets')
      return
    }

    if (selectedActivities.length === 0) {
      alert('Please select at least one activity')
      return
    }

    // Check if we have topics or custom topic
    const finalTopics = customTopic.trim() 
      ? [customTopic.trim()] 
      : selectedTopics.length > 0 
        ? selectedTopics 
        : ['Reading comprehension story']

    if (finalTopics.length === 0) {
      alert('Please select a topic or enter a custom topic')
      return
    }

    setIsPreviewing(true)
    
    try {
      console.log('🚀 Generating worksheet preview...')
      console.log('Topics:', finalTopics)
      console.log('Activities:', selectedActivities)
      console.log('Count:', worksheetCount)
      console.log('Reading Level:', profile?.reading_level || 3)
      console.log('Writing Level:', profile?.writing_level || 3)

      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: finalTopics,
          activities: selectedActivities,
          count: worksheetCount,
          readingLevel: profile?.reading_level || 3,
          writingLevel: profile?.writing_level || 3,
          previewOnly: true,  // Request preview data only
          userId: user?.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle usage limit exceeded errors specifically
        if (response.status === 403 && errorData.upgrade_required) {
          alert(`${errorData.message}\n\nUpgrade to Premium for unlimited worksheets!`)
          return
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to generate worksheet')
      }

      const data = await response.json()
      console.log('📋 Received preview data:', data)
      
      // For Free Plan users, show preview without PDF
      if (!isPremium) {
        console.log('🆓 Free Plan user - showing preview without PDF')
        setPreviewData({ stories: data.stories, pdfBase64: '' })
        setShowPreviewModal(true)
        
        // Refresh usage count for Free Plan users
        if (user?.id) {
          try {
            const usageInfo = await canGenerateWorksheets(user.id, 0)
            setMonthlyUsage(usageInfo.currentCount)
          } catch (error) {
            console.error('Error refreshing usage count:', error)
          }
        }
        return
      }
      
      // For Premium users, generate PDF for preview using the actual story data
      const pdfResponse = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: finalTopics,
          activities: selectedActivities,
          count: worksheetCount,
          readingLevel: profile?.reading_level || 3,
          writingLevel: profile?.writing_level || 3,
          usePreviewData: true,
          previewStoryData: data.stories,
          userId: user?.id
        }),
      })

      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json()
        
        // Handle usage limit exceeded errors specifically
        if (pdfResponse.status === 403 && errorData.upgrade_required) {
          alert(`${errorData.message}\n\nUpgrade to Premium for unlimited worksheets!`)
          return
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to generate worksheet')
      }

      const blob = await pdfResponse.blob()
      const pdfBase64 = await blobToBase64(blob)

      setPreviewData({ stories: data.stories, pdfBase64 })
      setShowPreviewModal(true)
      
    } catch (error) {
      console.error('❌ Error generating worksheet:', error)
      alert('Failed to generate worksheet. Please try again.')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleGenerateWorksheetFinal = async () => {
    if (!previewData) {
      alert('Please preview the worksheet first')
      return
    }

    // Block Free Plan users from PDF download
    if (!isPremium) {
      alert('Free Plan allows worksheet previews only. Upgrade to Premium for PDF downloads!')
      router.push('/pricing')
      return
    }

    try {
      setIsGenerating(true)
      
      // Generate final PDF with actual data
      const finalTopics = customTopic.trim() 
        ? [customTopic.trim()] 
        : selectedTopics.length > 0 
          ? selectedTopics 
          : ['Reading comprehension story']

      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: finalTopics,
          activities: selectedActivities,
          count: worksheetCount,
          readingLevel: profile?.reading_level || 3,
          writingLevel: profile?.writing_level || 3,
          usePreviewData: true,
          previewStoryData: previewData.stories,
          userId: user?.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle usage limit exceeded errors specifically
        if (response.status === 403 && errorData.upgrade_required) {
          alert(`${errorData.message}\n\nUpgrade to Premium for unlimited worksheets!`)
          return
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to generate worksheet')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `worksheet-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setShowPreviewModal(false)
      alert('Worksheet downloaded successfully!')
      
    } catch (error) {
      console.error('❌ Error downloading worksheet:', error)
      alert('Failed to download worksheet. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1]) // Remove data:application/pdf;base64, prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const topics = [
    { id: 'cooking', label: 'Cooking', icon: '🍳' },
    { id: 'morning', label: 'Morning Routine', icon: '🌅' },
    { id: 'cleaning', label: 'Cleaning Room', icon: '🧹' },
    { id: 'plants', label: 'Growing Plants', icon: '🌱' },
    { id: 'homework', label: 'Doing Homework', icon: '📚' },
    { id: 'friendship', label: 'Making Friends', icon: '👫' }
  ]

  const activities = [
    { id: 'wh-questions', label: 'WH Questions', icon: '❓', description: 'Who, when, where, what, how, why' },
    { id: 'emotion-quiz', label: 'Emotion Quiz', icon: '😊', description: 'Understanding character emotions' },
    { id: 'bme-story', label: 'BME Story', icon: '📖', description: 'Beginning-Middle-End structure' },
    { id: 'sentence-order', label: 'Sentence Order', icon: '🔢', description: 'Arrange sentences in logical order' },
    { id: 'three-line-summary', label: 'Three Line Summary', icon: '📝', description: 'Summarize key content in 3 lines' },
    { id: 'sentence-completion', label: 'Sentence Completion', icon: '✏️', description: 'Fill in blanks to understand context' },
    { id: 'draw-and-tell', label: 'Draw and Tell', icon: '🎨', description: 'Draw pictures and create stories' }
  ]

  const handleTopicChange = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    )
  }

  const handleActivityChange = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    )
  }

  const handleRandomTopic = () => {
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    setSelectedTopics([randomTopic.id])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Book className="w-8 h-8 text-blue-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">AutismCanRead</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <Link
                href="/settings"
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">📄 Create Worksheet</h2>
            <p className="text-gray-600">Create customized reading worksheets for children</p>
          </div>

          {/* Subscription Status */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Choose Story Topics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {topics.map((topic) => (
                <label key={topic.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic.id)}
                    onChange={() => handleTopicChange(topic.id)}
                    className="w-5 h-5 text-blue-600 rounded mr-3"
                  />
                  <span className="text-2xl mr-2">{topic.icon}</span>
                  <span className="text-gray-700">{topic.label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Enter custom topic"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleRandomTopic}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                🎲 Random Topic
              </button>
            </div>
          </div>

          {/* Activity Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Select Activities to Include</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => (
                <label key={activity.id} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedActivities.includes(activity.id)}
                    onChange={() => handleActivityChange(activity.id)}
                    className="w-5 h-5 text-blue-600 rounded mt-1 mr-3"
                  />
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="text-xl mr-2">{activity.icon}</span>
                      <span className="font-semibold text-gray-900">{activity.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Worksheet Count */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Number of Worksheets to Generate</h3>
            <div className="flex items-center space-x-4 justify-center">
              <button
                onClick={() => setWorksheetCount(1)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  worksheetCount === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                1 worksheet
              </button>
              <button
                onClick={() => setWorksheetCount(3)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  worksheetCount === 3
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                3 worksheets
              </button>
            </div>
          </div>

          {/* Generate & Preview Buttons */}
          <div className="flex justify-center">
            <button
              onClick={handlePreviewWorksheet}
              disabled={isPreviewing}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              {isPreviewing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Generating Preview...
                </div>
              ) : (
                <>
                  <Eye className="w-6 h-6 mr-3 inline" />
                  Preview Worksheet
                </>
              )}
            </button>
          </div>
            
          {/* Helper Text */}
          <div className="text-center text-sm text-gray-600 mt-4">
            <p className="mb-2">
              📝 <strong>Worksheet PDF:</strong> Contains questions and activities for children to complete
            </p>
            <p>
              🔑 <strong>Answer Key PDF:</strong> Contains the same activities with answers highlighted in red for teachers/parents
            </p>
          </div>

          {/* Premium Features Banner */}
          {checkingPremium ? (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Loading Subscription Status...</h3>
                  <p className="text-blue-700 text-sm">
                    Checking your plan and monthly usage...
                  </p>
                </div>
              </div>
            </div>
          ) : subscriptionError ? (
            <div className="mt-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Error Checking Subscription Status</h3>
                  <p className="text-red-700 text-sm">
                    An error occurred while checking your subscription status. Please try again or contact support.
                  </p>
                </div>
              </div>
            </div>
          ) : !isPremium ? (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Crown className="w-6 h-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Free Plan - Limited Usage</h3>
                    <p className="text-yellow-700 text-sm">
                      You've used {Math.min(monthlyUsage, 5)}/5 worksheets this month. PDF downloads require premium.
                    </p>
                  </div>
                </div>
                <Link 
                  href="/pricing"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Crown className={`w-6 h-6 mr-3 ${profile?.subscription_status === 'cancelled' ? 'text-orange-500' : 'text-green-600'}`} />
                  <div>
                    <h3 className={`text-lg font-semibold ${profile?.subscription_status === 'cancelled' ? 'text-orange-800' : 'text-green-800'}`}>
                      {profile?.subscription_status === 'cancelled' ? 'Premium Active (Cancelled)' : 'Premium Active'}
                    </h3>
                    <p className={`text-sm ${profile?.subscription_status === 'cancelled' ? 'text-orange-700' : 'text-green-700'}`}>
                      {profile?.subscription_status === 'cancelled' 
                        ? 'Your subscription is cancelled but you still have access to Premium features until your current billing period ends.'
                        : `You have access to all features including unlimited PDF downloads.${monthlyUsage > 0 ? ` You've generated ${monthlyUsage} worksheets this month.` : ''}`
                      }
                    </p>
                  </div>
                </div>
                <Link
                  href="/subscription"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Manage Subscription
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reactivated Message */}
      {showReactivatedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Subscription Reactivated</h2>
                <button
                  onClick={() => setShowReactivatedMessage(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 text-lg">
                Your subscription has been successfully reactivated. You can now access all Premium features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Content Preview</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Story Section */}
                {previewData && previewData.stories && Array.isArray(previewData.stories) ? 
                  previewData.stories.map((story: any, index: number) => (
                    <div key={index} className="border-2 border-dashed border-gray-300 p-6 rounded-lg space-y-4">
                      {/* Worksheet Header */}
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-purple-800 mb-2">📚 Worksheet {index + 1}</h2>
                        <hr className="border-purple-300 mb-4" />
                      </div>
                      
                      {/* Story Content */}
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-blue-800 mb-4">{story.title}</h3>
                        <p className="text-gray-700 leading-relaxed">{story.content}</p>
                      </div>

                      {/* Activities for this worksheet */}
                      <div className="space-y-4">
                        {story.whQuestions && Array.isArray(story.whQuestions) && (
                          <div className="bg-yellow-50 p-6 rounded-lg">
                            <h4 className="text-lg font-bold text-yellow-800 mb-4">❓ WH Questions</h4>
                            <div className="space-y-2">
                              {story.whQuestions.map((q: any, qIndex: number) => (
                                <div key={qIndex} className="text-gray-700">
                                  {qIndex + 1}. {q.question}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {story.bmeStory && (
                          <div className="bg-purple-50 p-6 rounded-lg">
                            <h4 className="text-lg font-bold text-purple-800 mb-4">📖 BME Story Structure</h4>
                            <div className="space-y-4">
                              <div>
                                <strong>Beginning:</strong>
                                <p className="text-gray-700 mt-1">_____________________________________</p>
                              </div>
                              <div>
                                <strong>Middle:</strong>
                                <p className="text-gray-700 mt-1">_____________________________________</p>
                              </div>
                              <div>
                                <strong>End:</strong>
                                <p className="text-gray-700 mt-1">_____________________________________</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {story.sentenceOrder?.sentences && Array.isArray(story.sentenceOrder.sentences) ? (
                          <div className="bg-indigo-50 p-6 rounded-lg">
                            <h4 className="text-lg font-bold text-indigo-800 mb-4">🔢 Sentence Order</h4>
                            <p className="text-gray-700 mb-3">Put these sentences in the correct order:</p>
                            <div className="space-y-2">
                              {story.sentenceOrder.sentences.map((sentence: string, sIndex: number) => (
                                <div key={sIndex} className="text-gray-700 bg-white p-2 rounded border">
                                  {sIndex + 1}. {sentence}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500">No sentences available</div>
                        )}

                        {story.threeLineSummary && (
                          <div className="bg-orange-50 p-6 rounded-lg">
                            <h4 className="text-lg font-bold text-orange-800 mb-4">📝 Three Line Summary</h4>
                            <p className="text-gray-700 mb-3">Summarize the story in three lines:</p>
                            <div className="space-y-3">
                              <div>
                                <strong>1.</strong> _____________________________
                              </div>
                              <div>
                                <strong>2.</strong> _____________________________
                              </div>
                              <div>
                                <strong>3.</strong> _____________________________
                              </div>
                            </div>
                          </div>
                        )}

                        {story.emotionQuiz && Array.isArray(story.emotionQuiz) && (
                          <div className="bg-pink-50 p-6 rounded-lg">
                            <h4 className="text-lg font-bold text-pink-800 mb-4">😊 Emotion Quiz</h4>
                            <div className="space-y-4">
                              {story.emotionQuiz.map((q: any, qIndex: number) => (
                                <div key={qIndex} className="text-gray-700">
                                  <div className="font-semibold">{qIndex + 1}. {q.question}</div>
                                  <div className="ml-4 mt-1">
                                    {q.options && Array.isArray(q.options) && q.options.map((option: string, optIndex: number) => (
                                      <div key={optIndex}>• {option}</div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {story.sentenceCompletion && Array.isArray(story.sentenceCompletion) && (
                          <div className="bg-green-50 p-6 rounded-lg">
                            <h4 className="text-lg font-bold text-green-800 mb-4">✏️ Sentence Completion</h4>
                            <div className="space-y-2">
                              {story.sentenceCompletion.map((s: any, sIndex: number) => (
                                <div key={sIndex} className="text-gray-700">
                                  {sIndex + 1}. {s.sentence}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {story.drawAndTell && story.drawAndTell.questions && Array.isArray(story.drawAndTell.questions) && (
                          <div className="bg-purple-50 p-6 rounded-lg">
                            <h4 className="text-lg font-bold text-purple-800 mb-4">🎨 Draw and Tell</h4>
                            <p className="text-gray-700 mb-3">{story.drawAndTell.prompt}</p>
                            <div className="space-y-1">
                              {story.drawAndTell.questions.map((q: string, qIndex: number) => (
                                <div key={qIndex} className="text-gray-700">
                                  {qIndex + 1}. {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-gray-500">
                      No story data available for preview
                    </div>
                  )}
              </div>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close Preview
                </button>
                {!isPremium && (
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      ✅ Preview completed! This counts as {worksheetCount} of your 5 monthly worksheets.
                    </p>
                    <p className="text-sm text-orange-600 font-medium">
                      💎 Upgrade to Premium for PDF downloads and unlimited worksheets
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (isPremium) {
                      handleGenerateWorksheetFinal()
                    } else {
                      router.push('/pricing')
                    }
                  }}
                  disabled={isGenerating || checkingPremium}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isGenerating || checkingPremium
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : isPremium
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  } text-white`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating PDF...
                    </>
                  ) : checkingPremium ? (
                    'Checking subscription...'
                  ) : isPremium ? (
                    `Download Complete Worksheet (${worksheetCount} worksheets + answer keys)`
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      Upgrade to Premium for PDF Downloads
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
