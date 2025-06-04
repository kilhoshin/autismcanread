'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, ArrowLeft, Download, RefreshCw, CheckCircle, Edit3, Lightbulb, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface BlankItem {
  id: number
  original: string
  withBlank: string
  answer: string
}

interface StoryContent {
  story: string
  blanks: BlankItem[]
  title: string
}

export default function SentenceCompletionActivity() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showHints, setShowHints] = useState(false)

  const topics = [
    { id: 'daily-routine', title: 'Daily Life', emoji: '🏠', color: 'bg-blue-100 border-blue-300' },
    { id: 'food-cooking', title: 'Food and Cooking', emoji: '🍳', color: 'bg-orange-100 border-orange-300' },
    { id: 'seasons-weather', title: 'Seasons and Weather', emoji: '🌤️', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'animals-nature', title: 'Animals and Nature', emoji: '🐼', color: 'bg-green-100 border-green-300' },
    { id: 'friendship', title: 'Friendship', emoji: '👫', color: 'bg-pink-100 border-pink-300' },
    { id: 'custom', title: 'Custom Topic', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const { profile } = useAuth()

  const generateStory = async () => {
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'sentence-completion',
          readingLevel: profile?.reading_level || 3,
          writingLevel: profile?.writing_level || 3,
          topic: selectedTopic
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStoryContent(data.content)
        setUserAnswers(new Array(data.content.blanks.length).fill(''))
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
      title: 'A Fun Day',
      story: `Today is Sunday, so I went to the park with my family. The park had many beautiful flowers. The kids played happily in the playground. We had a picnic lunch and talked. In the afternoon, we watched ducks on the lake. It was a really fun day.`,
      blanks: [
        {
          id: 1,
          original: 'Today is Sunday, so I went to the park with my family.',
          withBlank: 'Today is ______, so I went to the park with my family.',
          answer: 'Sunday'
        },
        {
          id: 2,
          original: 'The park had many beautiful flowers.',
          withBlank: 'The park had many beautiful ______.',
          answer: 'flowers'
        },
        {
          id: 3,
          original: 'The kids played happily in the playground.',
          withBlank: 'The kids played happily in the ______.',
          answer: 'playground'
        },
        {
          id: 4,
          original: 'We had a picnic lunch and talked.',
          withBlank: 'We had a ______ lunch and talked.',
          answer: 'picnic'
        },
        {
          id: 5,
          original: 'In the afternoon, we watched ducks on the lake.',
          withBlank: 'In the afternoon, we watched ______ on the lake.',
          answer: 'ducks'
        }
      ]
    }
    
    setStoryContent(sampleStory)
    setUserAnswers(new Array(sampleStory.blanks.length).fill(''))
    setCurrentStep(3)
  }

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentBlankIndex] = value
    setUserAnswers(newAnswers)
  }

  const goToNextBlank = () => {
    if (currentBlankIndex < (storyContent?.blanks.length || 0) - 1) {
      setCurrentBlankIndex(currentBlankIndex + 1)
    }
  }

  const goToPrevBlank = () => {
    if (currentBlankIndex > 0) {
      setCurrentBlankIndex(currentBlankIndex - 1)
    }
  }

  const checkAllAnswers = () => {
    setIsComplete(true)
    setCurrentStep(4)
  }

  const resetAnswers = () => {
    setUserAnswers(new Array(storyContent?.blanks.length || 0).fill(''))
    setCurrentBlankIndex(0)
    setIsComplete(false)
  }

  const getScore = () => {
    if (!storyContent) return 0
    let correct = 0
    storyContent.blanks.forEach((blank, index) => {
      if (userAnswers[index]?.trim().toLowerCase() === blank.answer.toLowerCase()) {
        correct++
      }
    })
    return Math.round((correct / storyContent.blanks.length) * 100)
  }

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'sentence-completion',
          storyContent: storyContent?.story,
          userAnswers: {
            blanks: storyContent?.blanks,
            userAnswers,
            score: getScore()
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.pdfData) {
          const link = document.createElement('a')
          link.href = data.pdfData
          link.download = `Sentence Completion_${new Date().toLocaleDateString('en-US')}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        console.error('PDF generation failed')
        alert('Failed to generate PDF. Please try again.')
      }
    } catch (error) {
      console.error('PDF download error:', error)
      alert('Error downloading PDF.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-indigo-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-indigo-500 p-3 rounded-xl">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sentence Completion</h1>
                <p className="text-sm text-gray-600">Fill in the blanks</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🤔 What topic would you like to choose?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    selectedTopic === topic.id 
                      ? `${topic.color} ring-4 ring-indigo-200 scale-105` 
                      : `${topic.color} hover:scale-105`
                  }`}
                >
                  <div className="text-4xl mb-3">{topic.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900">{topic.title}</h3>
                </button>
              ))}
            </div>

            {/* Activity explanation */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-indigo-800 mb-3">🎯 How to play</h3>
              <div className="space-y-2 text-indigo-700">
                <p>• Read the story and think of a word to fill in the blank</p>
                <p>• Understand the context and find the correct word</p>
                <p>• Solve the problems one by one</p>
                <p>• Check your score after completing all the problems</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                Generate Sentence Completion Problems ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generate story */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI is generating sentence completion problems!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              Generate Problems
            </button>
          </div>
        )}

        {/* Step 3: Fill in the blanks */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* Original story */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                📖 Read the story and fill in the blanks
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-4">
                {storyContent.story}
              </div>
              <div className="text-center text-gray-600">
                Some words are missing from the story. Fill in the blanks!
              </div>
            </div>

            {/* Problem solving */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  ✏️ Problem {currentBlankIndex + 1} / {storyContent.blanks.length}
                </h3>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showHints ? 'Hide Hints' : 'Show Hints'}
                </button>
              </div>

              {/* Current problem */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
                <div className="text-lg text-gray-800 mb-4 leading-relaxed">
                  {storyContent.blanks[currentBlankIndex]?.withBlank}
                </div>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={userAnswers[currentBlankIndex] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Enter a word to fill in the blank"
                    className="flex-1 p-4 border-2 border-indigo-300 rounded-xl text-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Hints */}
                {showHints && (
                  <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2">💡 Hints</h4>
                    <p className="text-yellow-700">
                      Original sentence: {storyContent.blanks[currentBlankIndex]?.original}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={goToPrevBlank}
                  disabled={currentBlankIndex === 0}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous Problem
                </button>

                <div className="flex space-x-2">
                  {storyContent.blanks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBlankIndex(index)}
                      className={`w-10 h-10 rounded-full font-bold ${
                        index === currentBlankIndex
                          ? 'bg-indigo-500 text-white'
                          : userAnswers[index]?.trim()
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {currentBlankIndex === storyContent.blanks.length - 1 ? (
                  <button
                    onClick={checkAllAnswers}
                    disabled={userAnswers.some(answer => !answer.trim())}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center"
                  >
                    Complete ✅
                  </button>
                ) : (
                  <button
                    onClick={goToNextBlank}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
                  >
                    Next Problem <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Check results */}
        {currentStep === 4 && storyContent && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
            <div className="text-center mb-8">
              <div className="bg-indigo-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 You completed the sentence completion activity!</h2>
              <div className="text-2xl font-bold text-indigo-600 mb-2">Score: {getScore()}%</div>
              <p className="text-xl text-gray-600">You improved your vocabulary and context understanding!</p>
            </div>

            {/* Results details */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-indigo-800 mb-4">📝 Check your answers</h3>
              <div className="space-y-4">
                {storyContent.blanks.map((blank, index) => {
                  const isCorrect = userAnswers[index]?.trim().toLowerCase() === blank.answer.toLowerCase()
                  return (
                    <div key={blank.id} className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Problem {index + 1}</span>
                        <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{blank.withBlank}</div>
                      <div className="flex justify-between text-sm">
                        <span>Your answer: <strong>{userAnswers[index] || '(Not answered)'}</strong></span>
                        <span>Correct answer: <strong>{blank.answer}</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

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
                  setUserAnswers([])
                  setCurrentBlankIndex(0)
                  setIsComplete(false)
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
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
