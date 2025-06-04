'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, ArrowLeft, Download, RefreshCw, CheckCircle, HelpCircle } from 'lucide-react'

interface WHQuestion {
  type: string
  question: string
  hint: string
}

interface StoryContent {
  story: string
  questions: WHQuestion[]
}

export default function WHQuestionsActivity() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null)
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const topics = [
    { id: 'playground', title: 'Playground', emoji: '🛝', color: 'bg-blue-100 border-blue-300' },
    { id: 'restaurant', title: 'Restaurant', emoji: '🍽️', color: 'bg-orange-100 border-orange-300' },
    { id: 'library', title: 'Library', emoji: '📚', color: 'bg-green-100 border-green-300' },
    { id: 'market', title: 'Market', emoji: '🛒', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'hospital', title: 'Hospital', emoji: '🏥', color: 'bg-red-100 border-red-300' },
    { id: 'custom', title: 'Custom', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const whTypes = [
    { 
      type: 'WHO', 
      korean: 'Who', 
      color: 'bg-red-500', 
      description: 'Find the person or animal',
      icon: '👥'
    },
    { 
      type: 'WHAT', 
      korean: 'What', 
      color: 'bg-blue-500', 
      description: 'Find the action or object',
      icon: '❓'
    },
    { 
      type: 'WHEN', 
      korean: 'When', 
      color: 'bg-green-500', 
      description: 'Find the time',
      icon: '⏰'
    },
    { 
      type: 'WHERE', 
      korean: 'Where', 
      color: 'bg-yellow-500', 
      description: 'Find the location',
      icon: '📍'
    },
    { 
      type: 'WHY', 
      korean: 'Why', 
      color: 'bg-purple-500', 
      description: 'Find the reason',
      icon: '🤔'
    },
    { 
      type: 'HOW', 
      korean: 'How', 
      color: 'bg-pink-500', 
      description: 'Find the method',
      icon: '🔧'
    }
  ]

  const generateStory = async () => {
    // Use sample data as fallback (API call in production)
    const sampleStory = {
      story: `Min-soo went to the new playground with his friends at 3 pm yesterday. 
      The playground had a big slide and swings. 
      Min-soo and his friends played tag and had a lot of fun. 
      It was too hot, so they decided to buy ice cream. 
      They all went to the nearby convenience store and bought cold ice cream.`,
      questions: [
        { type: 'WHO', question: 'Who went to the playground?', hint: 'Name is mentioned' },
        { type: 'WHAT', question: 'What game did the kids play at the playground?', hint: 'It\'s a running game' },
        { type: 'WHEN', question: 'What time did they go to the playground?', hint: 'Find the time of day' },
        { type: 'WHERE', question: 'Where did the kids play?', hint: 'It has a slide' },
        { type: 'WHY', question: 'Why did they buy ice cream?', hint: 'Related to the weather' },
        { type: 'HOW', question: 'How did they get the ice cream?', hint: 'Find where they bought it' }
      ]
    }
    
    setStoryContent(sampleStory)
    setCurrentStep(3)
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < (storyContent?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setCurrentStep(4)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const currentQuestion = storyContent?.questions[currentQuestionIndex]
  const currentWHType = whTypes.find(wh => wh.type === currentQuestion?.type)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-xl">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WH Question Practice</h1>
                <p className="text-sm text-gray-600">Story comprehension through WH questions</p>
              </div>
            </Link>
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Choose topic */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🤔 Which situation would you like to practice?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    selectedTopic === topic.id 
                      ? `${topic.color} ring-4 ring-blue-200 scale-105` 
                      : `${topic.color} hover:scale-105`
                  }`}
                >
                  <div className="text-4xl mb-3">{topic.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900">{topic.title}</h3>
                </button>
              ))}
            </div>

            {/* WH question types guide */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-center mb-4 text-gray-900">🎯 Question types to practice</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {whTypes.map((wh) => (
                  <div key={wh.type} className={`${wh.color} text-white p-4 rounded-lg text-center`}>
                    <div className="text-2xl mb-1">{wh.icon}</div>
                    <div className="font-bold">{wh.korean}</div>
                    <div className="text-sm mt-1 opacity-90">{wh.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                Create story ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generate story */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI is creating a story for WH question practice!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              Generate story
            </button>
          </div>
        )}

        {/* Step 3: Answer questions */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* Read story */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">📖 Read the story and answer the questions</h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-6">
                {storyContent.story}
              </div>
              
              {/* Progress */}
              <div className="text-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                  Question {currentQuestionIndex + 1} / {storyContent.questions.length}
                </span>
              </div>
            </div>

            {/* Current question */}
            {currentWHType && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100">
                <div className="text-center mb-6">
                  <div className={`${currentWHType.color} text-white p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-3xl`}>
                    {currentWHType.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentWHType.korean} ({currentWHType.type})
                  </h3>
                  <p className="text-gray-600">{currentWHType.description}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-xl font-bold mb-4 text-center text-gray-900">
                    {currentQuestion?.question}
                  </label>
                  <textarea
                    value={userAnswers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                    className="w-full p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg resize-none h-32"
                    placeholder="Read the story again and find the answer..."
                  />
                  
                  {/* Hint */}
                  <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-yellow-800">
                      💡 <strong>Hint:</strong> {currentQuestion?.hint}
                    </p>
                  </div>
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                  >
                    Previous question
                  </button>
                  
                  <button
                    onClick={nextQuestion}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    {currentQuestionIndex === storyContent.questions.length - 1 ? 'Complete 🎉' : 'Next question'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100 text-center">
            <div className="mb-8">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 WH question practice completed!</h2>
              <p className="text-xl text-gray-600">You answered all questions well! Your reading comprehension has improved.</p>
            </div>

            {/* Results summary */}
            <div className="mb-8 grid md:grid-cols-3 gap-4">
              {whTypes.map((wh, index) => (
                <div key={wh.type} className={`${wh.color} text-white p-4 rounded-xl`}>
                  <div className="text-2xl mb-2">{wh.icon}</div>
                  <div className="font-bold">{wh.korean}</div>
                  <div className="text-sm opacity-90">
                    {userAnswers[index] ? '✅ Answered' : '❌ Not answered'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {/* TODO: PDF generation */}}
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
                  setUserAnswers({})
                  setCurrentQuestionIndex(0)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try again
              </button>
              <Link
                href="/dashboard"
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
