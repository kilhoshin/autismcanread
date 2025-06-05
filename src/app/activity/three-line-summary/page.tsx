'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, RotateCcw, CheckCircle, FileText, Edit3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Book, Lightbulb } from 'lucide-react'

interface StoryContent {
  story: string
  summaryGuide: string[]
  title: string
}

export default function ThreeLineSummaryActivity() {
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null)
  const [userSummary, setUserSummary] = useState(['', '', ''])
  const [isComplete, setIsComplete] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const topics = [
    { id: 'school-day', title: 'A Day at School', emoji: '🏫', color: 'bg-blue-100 border-blue-300' },
    { id: 'family-trip', title: 'Family Trip', emoji: '✈️', color: 'bg-green-100 border-green-300' },
    { id: 'pet-story', title: 'Pet Story', emoji: '🐕', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'birthday-party', title: 'Birthday Party', emoji: '🎂', color: 'bg-pink-100 border-pink-300' },
    { id: 'nature-walk', title: 'Nature Walk', emoji: '🌳', color: 'bg-green-100 border-green-300' },
    { id: 'custom', title: 'Custom Topic', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const generateStory = async () => {
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'three-line-summary',
          readingLevel: profile?.reading_level || 3,
          writingLevel: profile?.writing_level || 3,
          topic: selectedTopic
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStoryContent(data.content)
        setCurrentStep(3)
      } else {
        console.error('AI story generation failed')
        useSampleData()
      }
    } catch (error) {
      console.error('AI API call error:', error)
      useSampleData()
    }
  }

  const useSampleData = () => {
    const sampleStory = {
      title: 'A Fun Day at School',
      story: `Today was Timmy's birthday. In the morning, his mom made him a delicious breakfast. When he got to school, his friends said "Happy birthday!" During lunch, the teacher brought out a cake. All the kids sang "Happy birthday" together. Timmy made a wish and blew out the candles. He shared the cake with his friends. When he got home, he had dinner with his family and got presents.`,
      summaryGuide: [
        'Timmy had a birthday breakfast with his mom',
        'He celebrated his birthday with his friends at school and had cake',
        'He had dinner with his family and got presents'
      ]
    }
    
    setStoryContent(sampleStory)
    setCurrentStep(3)
  }

  const handleSummaryChange = (index: number, value: string) => {
    const newSummary = [...userSummary]
    newSummary[index] = value
    setUserSummary(newSummary)
  }

  const checkSummary = () => {
    setIsComplete(true)
  }

  const resetSummary = () => {
    setUserSummary(['', '', ''])
    setIsComplete(false)
  }

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'Three Line Summary Activity',
          readingLevel: 2,
          activities: ['three-line-summary'],
          customStory: {
            title: 'Story Summary Activity',
            content: storyContent?.story,
            threeLineSummary: {
              userSummary: userSummary,
              summaryGuide: storyContent?.summaryGuide
            }
          }
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'three-line-summary-worksheet.pdf'
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-purple-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-purple-500 p-3 rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Three-Line Summary</h1>
                <p className="text-sm text-gray-600">Summarize the main points of a story</p>
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
        {/* Step 1: Choose a topic */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              📝 What story would you like to summarize?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    selectedTopic === topic.id 
                      ? `${topic.color} ring-4 ring-purple-200 scale-105` 
                      : `${topic.color} hover:scale-105`
                  }`}
                >
                  <div className="text-4xl mb-3">{topic.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900">{topic.title}</h3>
                </button>
              ))}
            </div>

            {/* Activity explanation */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-purple-800 mb-3">🎯 How to play</h3>
              <div className="space-y-2 text-purple-700">
                <p>• Read the story and understand the content</p>
                <p>• Find the main points and summarize them in 3 lines</p>
                <p>• Write one line for the beginning, middle, and end of the story</p>
                <p>• Keep it simple and clear</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                Create a story to summarize ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generate story */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI is generating a story for you!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              Generate story
            </button>
          </div>
        )}

        {/* Step 3: Read and summarize */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* Original story */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                📖 Read the story and summarize it in 3 lines
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-4">
                {storyContent.story}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showGuide ? 'Hide hints' : 'Show hints'}
                </button>
              </div>
              
              {/* Summary guide (hints) */}
              {showGuide && storyContent.summaryGuide && (
                <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-yellow-800 mb-3">💡 Summary hints</h4>
                  <div className="space-y-2">
                    {storyContent.summaryGuide.map((guide, index) => (
                      <p key={index} className="text-yellow-700">
                        <strong>{index + 1} line:</strong> {guide}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Write summary */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">✍️ Write a 3-line summary</h3>
              
              <div className="space-y-6">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-2">
                    <label className="flex items-center text-lg font-semibold text-gray-700">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mr-3 text-sm">
                        {num}
                      </div>
                      {num} line summary
                    </label>
                    <textarea
                      value={userSummary[num - 1]}
                      onChange={(e) => handleSummaryChange(num - 1, e.target.value)}
                      placeholder={`${num} line summary...`}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg resize-none focus:border-purple-400 focus:outline-none"
                      rows={2}
                      disabled={isComplete}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-center space-x-4 mt-8">
                {!isComplete ? (
                  <>
                    <button
                      onClick={checkSummary}
                      disabled={userSummary.some(line => line.trim() === '')}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
                    >
                      Complete summary ✅
                    </button>
                    <button
                      onClick={resetSummary}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Reset
                    </button>
                  </>
                ) : (
                  <div className="bg-green-100 border-2 border-green-300 rounded-xl p-6 text-center w-full">
                    <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-2xl font-bold text-green-800 mb-2">You completed the summary!</h4>
                    <p className="text-lg text-gray-700 mb-6">
                      You did a great job summarizing the story!
                    </p>

                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        Finish 🎊
                      </button>
                      <button
                        onClick={downloadPDF}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download PDF
                      </button>
                      <button
                        onClick={resetSummary}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Finish */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100 text-center">
            <div className="mb-8">
              <div className="bg-purple-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 You finished the three-line summary activity!</h2>
              <p className="text-xl text-gray-600">You improved your reading comprehension and summarization skills!</p>
            </div>

            {/* View completed summary */}
            {userSummary.some(line => line.trim() !== '') && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-purple-800 mb-4">📝 Completed summary</h3>
                <div className="space-y-3 text-left">
                  {userSummary.map((line, index) => (
                    line.trim() && (
                      <div key={index} className="flex items-start">
                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center mr-3 text-sm flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <p className="text-gray-800 text-lg">{line}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={downloadPDF}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1)
                  setSelectedTopic('')
                  setStoryContent(null)
                  setUserSummary(['', '', ''])
                  setIsComplete(false)
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Try again
              </button>
              <Link
                href="/dashboard"
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold"
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
