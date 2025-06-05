'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book, ArrowLeft, Wand2, Download, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface StoryContent {
  story: string
  sections: {
    beginning: string
    middle: string
    end: string
  }
}

export default function BMEStoryActivity() {
  const [currentStep, setCurrentStep] = useState(1) // 1: Choose topic, 2: Generate story, 3: Activity, 4: Complete
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [userAnswers, setUserAnswers] = useState({
    beginning: '',
    middle: '',
    end: ''
  })

  const topics = [
    { id: 'zoo', title: 'Zoo Adventure', emoji: '🦁', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'birthday', title: 'Birthday Party', emoji: '🎂', color: 'bg-pink-100 border-pink-300' },
    { id: 'school', title: 'School Life', emoji: '🏫', color: 'bg-blue-100 border-blue-300' },
    { id: 'friend', title: 'Playing with Friends', emoji: '👫', color: 'bg-green-100 border-green-300' },
    { id: 'family', title: 'Family Trip', emoji: '✈️', color: 'bg-purple-100 border-purple-300' },
    { id: 'custom', title: 'Custom Topic', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const { profile, user } = useAuth()

  const generateStory = async () => {
    setIsGenerating(true)
    const topic = selectedTopic === 'custom' ? customTopic : topics.find(t => t.id === selectedTopic)?.title

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType: 'bme-story',
          readingLevel: profile?.reading_level || 3,
          writingLevel: profile?.writing_level || 3,
          topic
        })
      })

      const data = await response.json()
      if (data.success) {
        setStoryContent(data.content)
        setCurrentStep(3)
      }
    } catch (error) {
      console.error('Story generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = () => {
    setCurrentStep(4)
  }

  const generatePDF = async () => {
    try {
      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: ['Beginning-Middle-End Story Analysis'],
          activities: ['bme-story'],
          count: 1,
          readingLevel: 2,
          writingLevel: 2,
          usePreviewData: true,
          previewStoryData: [{
            title: 'Story Analysis',
            content: storyContent?.story || '',
            bmeStory: {
              beginning: userAnswers?.beginning,
              middle: userAnswers?.middle,
              end: userAnswers?.end
            }
          }]
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'bme-story-analysis-worksheet.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        if (errorData.code === 'PREMIUM_REQUIRED') {
          alert('Premium subscription required for PDF downloads')
        } else {
          alert('Failed to generate worksheet. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error generating worksheet:', error)
      alert('Failed to generate worksheet. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-red-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-red-500 p-3 rounded-xl">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">B-M-E Story Cards</h1>
                <p className="text-sm text-gray-600">Understanding Beginning-Middle-End structure</p>
              </div>
            </Link>
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  currentStep >= step 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 ${
                    currentStep > step ? 'bg-red-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-gray-600">
            {currentStep === 1 && 'Choose a topic'}
            {currentStep === 2 && 'AI is generating a story'}
            {currentStep === 3 && 'Read the story and identify the B-M-E'}
            {currentStep === 4 && 'Activity completed!'}
          </div>
        </div>

        {/* Step 1: Choose topic */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-red-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              📚 What kind of story do you want to read?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    selectedTopic === topic.id 
                      ? `${topic.color} ring-4 ring-red-200 scale-105` 
                      : `${topic.color} hover:scale-105`
                  }`}
                >
                  <div className="text-4xl mb-3">{topic.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900">{topic.title}</h3>
                </button>
              ))}
            </div>

            {selectedTopic === 'custom' && (
              <div className="mb-6">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="What topic do you want to create a story about?"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:outline-none text-lg"
                />
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic || (selectedTopic === 'custom' && !customTopic.trim())}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
              >
                Create Story ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generate story */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-red-100 text-center">
            <div className="mb-6">
              <Wand2 className="w-16 h-16 text-red-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI is creating a story!</h2>
              <p className="text-xl text-gray-600">Please wait...</p>
            </div>
            
            <button
              onClick={generateStory}
              disabled={isGenerating}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Create Story'}
            </button>
          </div>
        )}

        {/* Step 3: Activity */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* Read the story */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-red-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">📖 Read the story</h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800">
                {storyContent.story}
              </div>
            </div>

            {/* Identify the B-M-E */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-red-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">🔍 Identify the B-M-E</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-bold mb-3 text-red-600">
                    📚 Beginning (Start) - The beginning of the story
                  </label>
                  <textarea
                    value={userAnswers.beginning}
                    onChange={(e) => setUserAnswers({...userAnswers, beginning: e.target.value})}
                    className="w-full p-4 border-2 border-red-200 rounded-xl focus:border-red-500 focus:outline-none resize-none h-24"
                    placeholder="How does the story start?"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold mb-3 text-yellow-600">
                    📖 Middle (Middle) - The middle of the story
                  </label>
                  <textarea
                    value={userAnswers.middle}
                    onChange={(e) => setUserAnswers({...userAnswers, middle: e.target.value})}
                    className="w-full p-4 border-2 border-yellow-200 rounded-xl focus:border-yellow-500 focus:outline-none resize-none h-24"
                    placeholder="What happens in the middle of the story?"
                  />
                </div>

                <div>
                  <label className="block text-lg font-bold mb-3 text-green-600">
                    📚 End (End) - The end of the story
                  </label>
                  <textarea
                    value={userAnswers.end}
                    onChange={(e) => setUserAnswers({...userAnswers, end: e.target.value})}
                    className="w-full p-4 border-2 border-green-200 rounded-xl focus:border-green-500 focus:outline-none resize-none h-24"
                    placeholder="How does the story end?"
                  />
                </div>
              </div>

              <div className="text-center mt-8">
                <button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  Submit 🎉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-red-100 text-center">
            <div className="mb-8">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 Activity completed!</h2>
              <p className="text-xl text-gray-600">Great job! You understood the B-M-E structure.</p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={generatePDF}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1)
                  setSelectedTopic('')
                  setCustomTopic('')
                  setStoryContent(null)
                  setUserAnswers({ beginning: '', middle: '', end: '' })
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </button>
              <Link
                href="/dashboard"
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
