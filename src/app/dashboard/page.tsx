'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Book, Download, History, Settings, LogOut, Plus, FileText, Eye, X, User, Crown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { canDownloadPDF, canGenerateWorksheets, incrementMonthlyUsage } from '@/utils/supabase'

export default function Dashboard() {
  const { user, profile, signOut, loading, refreshProfile } = useAuth()
  const router = useRouter()
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

  const handlePreviewWorksheet = async () => {
    if (selectedTopics.length === 0 || selectedActivities.length === 0) {
      alert('Please select at least one topic and one activity.')
      return
    }

    // Check monthly limit for free users
    if (!isPremium && user?.id) {
      const usageInfo = await canGenerateWorksheets(user.id, worksheetCount)
      if (!usageInfo.canGenerate) {
        alert(`You've reached your monthly limit of 5 worksheets. You've generated ${usageInfo.currentCount} this month. Please upgrade to Premium for unlimited worksheets.`)
        return
      }
    }

    setIsPreviewing(true)
    
    try {
      const response = await fetch('/api/preview-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: selectedTopics.length > 0 ? selectedTopics : [customTopic],
          activities: selectedActivities,
          count: worksheetCount, // Generate the actual number of worksheets for preview
          readingLevel: profile?.reading_level || 3,
          writingLevel: profile?.writing_level || 3
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Received preview data:', data)
        console.log('Stories in preview data:', data.stories)
        data.stories?.forEach((story: any, index: number) => {
          console.log(`Preview Story ${index + 1}:`, {
            title: story.title,
            hasWhQuestions: !!story.whQuestions,
            whQuestionsCount: story.whQuestions?.length || 0,
            hasEmotionQuiz: !!story.emotionQuiz,
            emotionQuizCount: story.emotionQuiz?.length || 0,
            hasStory: !!story.story,
            storyLength: story.story?.length || 0
          })
        })
        setPreviewData(data)
        setShowPreviewModal(true)
        
        // Increment monthly usage for free users after successful preview generation
        if (!isPremium && user?.id) {
          // Development mode: check current local state to prevent exceeding limits
          if (monthlyUsage + worksheetCount > 5) {
            alert(`Monthly limit exceeded! You can only generate ${5 - monthlyUsage} more worksheets this month. Please upgrade to Premium for unlimited access.`)
            setShowPreviewModal(false)
            return
          }
          
          // Double-check: verify we haven't exceeded limits before incrementing
          const usageCheck = await canGenerateWorksheets(user.id, worksheetCount)
          if (!usageCheck.canGenerate) {
            alert(`Monthly limit exceeded! You can only generate ${5 - usageCheck.currentCount} more worksheets this month. Please upgrade to Premium for unlimited access.`)
            setShowPreviewModal(false)
            return
          }
          
          const incrementSuccess = await incrementMonthlyUsage(user.id, worksheetCount)
          if (incrementSuccess) {
            // Update local state to reflect the new count
            setMonthlyUsage(prev => prev + worksheetCount)
          } else {
            console.warn('Failed to increment monthly usage')
          }
        }
      } else {
        alert('Failed to generate preview.')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      alert('Error occurred while generating preview.')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleGenerateWorksheet = async () => {
    if (selectedTopics.length === 0 || selectedActivities.length === 0) {
      alert('Please select at least one topic and one activity.')
      return
    }

    // Check if user has premium subscription for PDF downloads
    if (!isPremium) {
      alert('Premium subscription required for PDF downloads. Please upgrade to download worksheets.')
      return
    }

    setIsGenerating(true)

    try {
      // If we have preview data, use it directly for PDF generation
      if (previewData) {
        const response = await fetch('/api/generate-worksheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topics: selectedTopics,
            activities: selectedActivities,
            count: worksheetCount,
            readingLevel: profile?.reading_level || 3,
            writingLevel: profile?.writing_level || 3,
            usePreviewData: true,
            previewStoryData: previewData.stories,
            userId: user?.id // Add userId for tracking
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `worksheet-with-answers-${new Date().toISOString().split('T')[0]}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          alert('Failed to generate worksheet.')
        }
      } else {
        // Original generation logic for when no preview data exists
        const response = await fetch('/api/generate-worksheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topics: selectedTopics,
            activities: selectedActivities,
            count: worksheetCount,
            readingLevel: profile?.reading_level || 3,
            writingLevel: profile?.writing_level || 3
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `worksheet-with-answers-${new Date().toISOString().split('T')[0]}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          alert('Failed to generate worksheet.')
        }
      }
    } catch (error) {
      console.error('Error generating worksheet:', error)
      alert('An error occurred while generating the worksheet.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Manual subscription update for debugging
  const handleManualSubscriptionUpdate = async (newStatus: 'free' | 'premium') => {
    if (!user) return
    
    try {
      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subscriptionStatus: newStatus
        })
      })
      
      if (response.ok) {
        console.log('✅ Manual subscription update successful')
        
        // Force profile refresh
        await refreshProfile()
        
        // Wait a bit and refresh again to ensure state is updated
        setTimeout(async () => {
          await refreshProfile()
          // Force a complete page reload as last resort
          window.location.reload()
        }, 1000)
      } else {
        console.error('❌ Manual subscription update failed')
      }
    } catch (error) {
      console.error('❌ Error in manual subscription update:', error)
    }
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
              {/* Debug: Show subscription status */}
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1 text-sm">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-yellow-800">
                    Debug: {isPremium ? '👑 Premium' : '🆓 Free'} | 
                    Profile: {profile?.subscription_status || 'undefined'} | 
                    User ID: {user?.id?.slice(0, 8)}...
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleManualSubscriptionUpdate('premium')}
                      disabled={isUpdatingSubscription}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      Set Premium
                    </button>
                    <button
                      onClick={() => handleManualSubscriptionUpdate('free')}
                      disabled={isUpdatingSubscription}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                    >
                      Set Free
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
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

          {/* Debug Info */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">🔍 Debug Info:</h3>
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>User Email:</strong> {user?.email}</p>
            <p><strong>Profile Subscription:</strong> {profile?.subscription_status || 'undefined'}</p>
            <p><strong>Is Premium (state):</strong> {isPremium ? 'true' : 'false'}</p>
            <p><strong>Profile Object:</strong> {JSON.stringify(profile, null, 2)}</p>
            
            <div className="mt-4 space-x-2">
              <button
                onClick={async () => {
                  const response = await fetch('/api/create-user-safe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user?.id,
                      email: user?.email,
                      fullName: user?.user_metadata?.full_name
                    })
                  })
                  const result = await response.json()
                  alert(JSON.stringify(result, null, 2))
                  if (result.success) {
                    await refreshProfile()
                    window.location.reload()
                  }
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                🔧 Create User Record
              </button>
            </div>
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
            <div className="flex items-center space-x-4">
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
                onClick={() => setWorksheetCount(7)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  worksheetCount === 7
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 worksheets (Weekly)
              </button>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={worksheetCount}
                  onChange={(e) => setWorksheetCount(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                />
                <span className="ml-2 text-gray-700">worksheets</span>
              </div>
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
              <div className="flex items-center">
                <Crown className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Premium Active</h3>
                  <p className="text-green-700 text-sm">
                    You have access to all features including unlimited PDF downloads. 
                    {monthlyUsage > 0 && ` You've generated ${monthlyUsage} worksheets this month.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                {previewData.stories.map((story: any, index: number) => (
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
                      {story.whQuestions && (
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

                      {story.sentenceOrder && (
                        <div className="bg-indigo-50 p-6 rounded-lg">
                          <h4 className="text-lg font-bold text-indigo-800 mb-4">🔢 Sentence Order</h4>
                          <p className="text-gray-700 mb-3">Put these sentences in the correct order:</p>
                          <div className="space-y-2">
                            {story.sentenceOrder.sentences?.map((sentence: string, sIndex: number) => (
                              <div key={sIndex} className="text-gray-700 bg-white p-2 rounded border">
                                {sIndex + 1}. {sentence}
                              </div>
                            ))}
                          </div>
                        </div>
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

                      {story.emotionQuiz && (
                        <div className="bg-pink-50 p-6 rounded-lg">
                          <h4 className="text-lg font-bold text-pink-800 mb-4">😊 Emotion Quiz</h4>
                          <div className="space-y-4">
                            {story.emotionQuiz.map((q: any, qIndex: number) => (
                              <div key={qIndex} className="text-gray-700">
                                <div className="font-semibold">{qIndex + 1}. {q.question}</div>
                                <div className="ml-4 mt-1">
                                  {q.options.map((option: string, optIndex: number) => (
                                    <div key={optIndex}>• {option}</div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {story.sentenceCompletion && (
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

                      {story.drawAndTell && (
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
                ))}
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
                      handleGenerateWorksheet()
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
