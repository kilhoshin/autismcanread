'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, ArrowLeft, Download, RefreshCw, CheckCircle, ArrowUpDown, GripVertical } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Sentence {
  id: number
  text: string
  correctOrder: number
}

interface StoryContent {
  story: string
  sentences: Sentence[]
  title: string
}

export default function SentenceOrderActivity() {
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null)
  const [userOrder, setUserOrder] = useState<Sentence[]>([])
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const topics = [
    { id: 'cooking', title: 'Cooking', emoji: '👩‍🍳', color: 'bg-orange-100 border-orange-300' },
    { id: 'morning', title: 'Morning Routine', emoji: '🌅', color: 'bg-blue-100 border-blue-300' },
    { id: 'cleaning', title: 'Cleaning', emoji: '🧹', color: 'bg-green-100 border-green-300' },
    { id: 'plants', title: 'Plant Care', emoji: '🌱', color: 'bg-emerald-100 border-emerald-300' },
    { id: 'homework', title: 'Homework', emoji: '📝', color: 'bg-purple-100 border-purple-300' },
    { id: 'friendship', title: 'Friendship', emoji: '👫', color: 'bg-pink-100 border-pink-300' }
  ]

  const generateStory = async () => {
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'sentence-order',
          readingLevel: profile?.reading_level || 3, 
          writingLevel: profile?.writing_level || 3, 
          topic: selectedTopic
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStoryContent(data.content)
        // Shuffle sentences to set initial order
        const shuffled = [...data.content.sentences].sort(() => Math.random() - 0.5)
        setUserOrder(shuffled)
        setCurrentStep(3)
      } else {
        console.error('AI story generation failed')
        // Use sample data on failure
        useSampleData()
      }
    } catch (error) {
      console.error('AI API call error:', error)
      // Use sample data on error
      useSampleData()
    }
  }

  const useSampleData = () => {
    // Sample data (used when AI API fails)
    const sampleStory = {
      title: 'Cooking Ramen',
      story: `Min-soo was hungry, so he decided to cook ramen. 
      First, he boiled water in a pot. 
      After the water boiled, he added ramen and seasoning. 
      He waited for 3 minutes and then ate it.`,
      sentences: [
        { id: 1, text: 'He ate the ramen.', correctOrder: 4 },
        { id: 2, text: 'He boiled water in a pot.', correctOrder: 1 },
        { id: 3, text: 'He added ramen and seasoning.', correctOrder: 3 },
        { id: 4, text: 'He waited for 3 minutes.', correctOrder: 4 },
        { id: 5, text: 'He waited for the water to boil.', correctOrder: 2 }
      ]
    }
    
    setStoryContent(sampleStory)
    // Shuffle sentences to set initial order
    const shuffled = [...sampleStory.sentences].sort(() => Math.random() - 0.5)
    setUserOrder(shuffled)
    setCurrentStep(3)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedItem === null) return

    const newOrder = [...userOrder]
    const draggedSentence = newOrder[draggedItem]
    
    // Remove dragged item
    newOrder.splice(draggedItem, 1)
    // Insert at new location
    newOrder.splice(dropIndex, 0, draggedSentence)
    
    setUserOrder(newOrder)
    setDraggedItem(null)
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...userOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    setUserOrder(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === userOrder.length - 1) return
    const newOrder = [...userOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    setUserOrder(newOrder)
  }

  const checkAnswer = () => {
    const isCorrect = userOrder.every((sentence, index) => 
      sentence.correctOrder === index + 1
    )
    setIsComplete(true)
    return isCorrect
  }

  const resetOrder = () => {
    if (storyContent) {
      const shuffled = [...storyContent.sentences].sort(() => Math.random() - 0.5)
      setUserOrder(shuffled)
      setIsComplete(false)
    }
  }

  const isCorrectOrder = isComplete && userOrder.every((sentence, index) => 
    sentence.correctOrder === index + 1
  )

  const downloadPDF = async () => {
    try {
      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: ['Sentence Order Activity'],
          activities: ['sentence-order'],
          count: 1,
          readingLevel: 2,
          writingLevel: 2,
          usePreviewData: true,
          previewStoryData: [{
            title: 'Sentence Ordering Exercise',
            content: storyContent?.story || '',
            sentenceOrder: {
              userOrder: userOrder,
              correctOrder: storyContent?.sentences.sort((a, b) => a.correctOrder - b.correctOrder),
              isCorrect: isCorrectOrder
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
        a.download = 'sentence-order-worksheet.pdf'
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
      console.error('PDF download error:', error)
      alert('An error occurred while downloading the PDF.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-green-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-green-500 p-3 rounded-xl">
                <ArrowUpDown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sentence Order Activity</h1>
                <p className="text-sm text-gray-600">Arrange sentences in the correct order</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🔄 Which topic would you like to practice?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    selectedTopic === topic.id 
                      ? `${topic.color} ring-4 ring-green-200 scale-105` 
                      : `${topic.color} hover:scale-105`
                  }`}
                >
                  <div className="text-4xl mb-3">{topic.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900">{topic.title}</h3>
                </button>
              ))}
            </div>

            {/* Activity explanation */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-green-800 mb-3">🎯 How to play</h3>
              <div className="space-y-2 text-green-700">
                <p>• Read the story and check the mixed-up sentences</p>
                <p>• Drag or click to arrange the sentences in the correct order</p>
                <p>• Think about the time sequence and logical flow</p>
                <p>• Check your answer when you're done</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                Create a story ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generate story */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI is generating a story for you!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              Generate story
            </button>
          </div>
        )}

        {/* Step 3: Arrange sentences */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* Original story */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                📖 Read the story and arrange the sentences
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-4">
                {storyContent.story}
              </div>
              <p className="text-center text-gray-600">
                The sentences below are mixed up. Arrange them in the correct order!
              </p>
            </div>

            {/* Arrange sentences */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">🔄 Arrange sentences</h3>
                <button
                  onClick={resetOrder}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Shuffle again
                </button>
              </div>

              {/* Mixed-up sentences */}
              <div className="space-y-3 mb-8">
                {userOrder.map((sentence, index) => (
                  <div
                    key={sentence.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-move transition-all hover:shadow-lg ${
                      isComplete 
                        ? sentence.correctOrder === index + 1
                          ? 'bg-green-100 border-green-300'
                          : 'bg-red-100 border-red-300'
                        : 'bg-white border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {/* Sentence number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                      {index + 1}
                    </div>

                    {/* Drag handle */}
                    <div className="flex-shrink-0 mr-4 text-gray-400">
                      <GripVertical className="w-6 h-6" />
                    </div>

                    {/* Sentence text */}
                    <div className="flex-1 text-lg text-gray-800">
                      {sentence.text}
                    </div>

                    {/* Move buttons */}
                    <div className="flex-shrink-0 flex flex-col space-y-1 ml-4">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-green-500 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === userOrder.length - 1}
                        className="p-1 text-gray-500 hover:text-green-500 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>

                    {/* Correct answer indicator */}
                    {isComplete && (
                      <div className="flex-shrink-0 ml-4">
                        {sentence.correctOrder === index + 1 ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <div className="w-6 h-6 text-red-600 font-bold">✗</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Check answer button */}
              {!isComplete ? (
                <div className="text-center">
                  <button
                    onClick={checkAnswer}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
                  >
                    Check answer ✅
                  </button>
                </div>
              ) : (
                <div className={`text-center p-6 rounded-xl ${
                  isCorrectOrder ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'
                }`}>
                  <div className="text-6xl mb-4">
                    {isCorrectOrder ? '🎉' : '💪'}
                  </div>
                  <h4 className={`text-2xl font-bold mb-2 ${
                    isCorrectOrder ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {isCorrectOrder ? 'Great job!' : 'Try again!'}
                  </h4>
                  <p className="text-lg text-gray-700 mb-6">
                    {isCorrectOrder 
                      ? 'You arranged all the sentences correctly!' 
                      : 'Check the red sentences and try again.'
                    }
                  </p>

                  <div className="flex justify-center space-x-4">
                    {isCorrectOrder ? (
                      <>
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
                      </>
                    ) : (
                      <button
                        onClick={() => setIsComplete(false)}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Finish */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100 text-center">
            <div className="mb-8">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 You completed the sentence order activity!</h2>
              <p className="text-xl text-gray-600">Your logical thinking and sequencing skills have improved!</p>
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
                  setUserOrder([])
                  setIsComplete(false)
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Play again
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
