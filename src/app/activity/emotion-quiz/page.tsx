'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, ArrowLeft, Download, RefreshCw, CheckCircle, Heart } from 'lucide-react'

interface EmotionOption {
  emotion: string
  emoji: string
  color: string
  description: string
}

interface QuizQuestion {
  scenario: string
  correctEmotion: string
  explanation: string
}

interface StoryContent {
  story: string
  questions: QuizQuestion[]
}

export default function EmotionQuizActivity() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)

  const topics = [
    { id: 'school-day', title: 'A Day at School', emoji: '🏫', color: 'bg-blue-100 border-blue-300' },
    { id: 'friendship', title: 'Friendship', emoji: '👫', color: 'bg-green-100 border-green-300' },
    { id: 'family-time', title: 'Family Time', emoji: '👨‍👩‍👧‍👦', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'pet-story', title: 'Pet Story', emoji: '🐕', color: 'bg-purple-100 border-purple-300' },
    { id: 'challenge', title: 'Overcoming Challenges', emoji: '💪', color: 'bg-red-100 border-red-300' },
    { id: 'custom', title: 'Custom', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const emotions: EmotionOption[] = [
    { emotion: 'Joy', emoji: '😊', color: 'bg-yellow-400', description: 'Happy and joyful feeling' },
    { emotion: 'Sadness', emoji: '😢', color: 'bg-blue-400', description: 'Sad and gloomy feeling' },
    { emotion: 'Anger', emoji: '😠', color: 'bg-red-400', description: 'Angry and frustrated feeling' },
    { emotion: 'Surprise', emoji: '😲', color: 'bg-purple-400', description: 'Startled and surprised feeling' },
    { emotion: 'Fear', emoji: '😨', color: 'bg-gray-500', description: 'Scared and fearful feeling' },
    { emotion: 'Love', emoji: '🥰', color: 'bg-pink-400', description: 'Warm and loving feeling' }
  ]

  const generateStory = async () => {
    // Sample data (API call in production)
    const sampleStory = {
      story: `Ji-min went to school this morning. 
      When he entered the classroom, his friends shouted "Happy birthday!" 
      Ji-min had forgotten his own birthday. 
      He was touched by the cake and gifts his friends had secretly prepared. 
      However, when he tried to cut the cake, he accidentally dropped it on the floor.
      His friends laughed and said it was okay, and the teacher brought a new cake.`,
      questions: [
        {
          scenario: 'How did Ji-min feel when his friends shouted "Happy birthday!"?',
          correctEmotion: 'Surprise',
          explanation: 'Ji-min had forgotten his own birthday, so he was startled and surprised by his friends\' celebration.'
        },
        {
          scenario: 'How did Ji-min feel when he received the cake and gifts?',
          correctEmotion: 'Love',
          explanation: 'Ji-min was touched by the thoughtful gesture of his friends, so he felt warm and loving.'
        },
        {
          scenario: 'How did Ji-min feel when he dropped the cake on the floor?',
          correctEmotion: 'Sadness',
          explanation: 'Ji-min was disappointed and sad that he had accidentally dropped the cake.'
        }
      ]
    }
    
    setStoryContent(sampleStory)
    setCurrentStep(3)
  }

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion)
  }

  const submitAnswer = () => {
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = selectedEmotion
    setUserAnswers(newAnswers)
    setShowExplanation(true)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < (storyContent?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedEmotion('')
      setShowExplanation(false)
    } else {
      setCurrentStep(4)
    }
  }

  const currentQuestion = storyContent?.questions[currentQuestionIndex]
  const isCorrect = selectedEmotion === currentQuestion?.correctEmotion

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-yellow-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-3 rounded-xl">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emotion Quiz</h1>
                <p className="text-sm text-gray-600">Understanding Emotions</p>
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
        {/* Step 1: Topic Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              😊 Which Emotion Story Would You Like to Read?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    selectedTopic === topic.id 
                      ? `${topic.color} ring-4 ring-yellow-200 scale-105` 
                      : `${topic.color} hover:scale-105`
                  }`}
                >
                  <div className="text-4xl mb-3">{topic.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900">{topic.title}</h3>
                </button>
              ))}
            </div>

            {/* Emotion Guide */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-center mb-4 text-gray-900">🎭 Emotions to Explore</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {emotions.map((emotion) => (
                  <div key={emotion.emotion} className={`${emotion.color} text-white p-4 rounded-lg text-center`}>
                    <div className="text-3xl mb-2">{emotion.emoji}</div>
                    <div className="font-bold text-lg">{emotion.emotion}</div>
                    <div className="text-sm opacity-90">{emotion.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-yellow-500 to-pink-600 hover:from-yellow-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                Create Emotion Story ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Story Generation */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI is Creating an Emotion Story!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-yellow-500 to-pink-600 hover:from-yellow-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              Generate Story
            </button>
          </div>
        )}

        {/* Step 3: Quiz */}
        {currentStep === 3 && storyContent && currentQuestion && (
          <div className="space-y-8">
            {/* Read Story */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">📖 Read the Story and Predict the Emotion</h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-4">
                {storyContent.story}
              </div>
              
              {/* Progress */}
              <div className="text-center">
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                  Question {currentQuestionIndex + 1} / {storyContent.questions.length}
                </span>
              </div>
            </div>

            {/* Emotion Prediction Question */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">
                🤔 {currentQuestion.scenario}
              </h3>

              {!showExplanation ? (
                <>
                  {/* Emotion Selection */}
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    {emotions.map((emotion) => (
                      <button
                        key={emotion.emotion}
                        onClick={() => handleEmotionSelect(emotion.emotion)}
                        className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                          selectedEmotion === emotion.emotion
                            ? `${emotion.color} text-white ring-4 ring-yellow-200 scale-105`
                            : `bg-white border-gray-200 hover:scale-105`
                        }`}
                      >
                        <div className="text-4xl mb-3">{emotion.emoji}</div>
                        <h4 className="text-lg font-bold">{emotion.emotion}</h4>
                        <p className="text-sm opacity-75">{emotion.description}</p>
                      </button>
                    ))}
                  </div>

                  <div className="text-center">
                    <button
                      onClick={submitAnswer}
                      disabled={!selectedEmotion}
                      className="bg-gradient-to-r from-yellow-500 to-pink-600 hover:from-yellow-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
                    >
                      Check Answer
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Correct Answer and Explanation */}
                  <div className={`p-6 rounded-xl mb-6 ${
                    isCorrect ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'
                  }`}>
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">
                        {isCorrect ? '🎉' : '💪'}
                      </div>
                      <h4 className={`text-2xl font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct!' : 'Try Again!'}
                      </h4>
                    </div>
                    
                    <div className="text-center mb-4">
                      <span className="text-lg font-semibold text-gray-700">Correct Answer: </span>
                      <span className="text-2xl">
                        {emotions.find(e => e.emotion === currentQuestion.correctEmotion)?.emoji}
                      </span>
                      <span className="text-xl font-bold ml-2">{currentQuestion.correctEmotion}</span>
                    </div>

                    <p className="text-gray-700 text-center text-lg">
                      💡 {currentQuestion.explanation}
                    </p>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={nextQuestion}
                      className="bg-gradient-to-r from-yellow-500 to-pink-600 hover:from-yellow-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
                    >
                      {currentQuestionIndex === storyContent.questions.length - 1 ? 'View Results 🎊' : 'Next Question'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Completion */}
        {currentStep === 4 && storyContent && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100 text-center">
            <div className="mb-8">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 You Completed the Emotion Quiz!</h2>
              <p className="text-xl text-gray-600">You understood the emotions well!</p>
            </div>

            {/* Results Summary */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">📊 Quiz Results</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {storyContent.questions.map((question, index) => {
                  const userAnswer = userAnswers[index]
                  const isCorrect = userAnswer === question.correctEmotion
                  const emotionData = emotions.find(e => e.emotion === question.correctEmotion)
                  
                  return (
                    <div key={index} className={`p-4 rounded-xl border-2 ${
                      isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                    }`}>
                      <div className="text-3xl mb-2">{emotionData?.emoji}</div>
                      <div className="font-bold">Question {index + 1}</div>
                      <div className="text-sm">{question.correctEmotion}</div>
                      <div className={`text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-6 text-2xl font-bold text-gray-900">
                Accuracy: {Math.round((userAnswers.filter((answer, index) => 
                  answer === storyContent.questions[index].correctEmotion
                ).length / storyContent.questions.length) * 100)}%
              </div>
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
                  setUserAnswers([])
                  setCurrentQuestionIndex(0)
                  setSelectedEmotion('')
                  setShowExplanation(false)
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
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
