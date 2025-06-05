'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Book, ArrowLeft, Download, RefreshCw, CheckCircle, Palette, Mic, MicOff, Save, Trash2 } from 'lucide-react'

interface DrawingData {
  imageData: string
  story: string
  title: string
}

export default function DrawAndTellActivity() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [userStory, setUserStory] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(3)

  const topics = [
    { id: 'family', title: 'My Family', emoji: '👨‍👩‍👧‍👦', color: 'bg-pink-100 border-pink-300' },
    { id: 'pet', title: 'My Pet', emoji: '🐕', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'friend', title: 'My Friend', emoji: '👫', color: 'bg-blue-100 border-blue-300' },
    { id: 'school', title: 'School Life', emoji: '🏫', color: 'bg-green-100 border-green-300' },
    { id: 'dream', title: 'My Dream', emoji: '🌟', color: 'bg-purple-100 border-purple-300' },
    { id: 'custom', title: 'Custom Topic', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
    '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#4B0082'
  ]

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.strokeStyle = currentColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Set white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL('image/png')
    console.log('Drawing saved:', imageData.substring(0, 50) + '...')
    setCurrentStep(3)
  }

  const handleStorySubmit = () => {
    if (userStory.trim()) {
      setIsComplete(true)
      setCurrentStep(4)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Voice recording feature will be implemented later
    if (!isRecording) {
      alert('Voice recording feature is under development. Please write your story in text.')
    }
  }

  const downloadPDF = async () => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const userDrawing = canvas.toDataURL('image/png')
      
      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'Draw and Tell Activity',
          readingLevel: 2,
          activities: ['draw-and-tell'],
          customStory: {
            title: 'Draw and Tell Exercise',
            content: userStory,
            drawAndTell: {
              userDrawing,
              userStory,
              prompts: ''
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
        a.download = 'draw-and-tell-worksheet.pdf'
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

  const resetActivity = () => {
    setCurrentStep(1)
    setSelectedTopic('')
    setCustomTopic('')
    setUserStory('')
    setIsComplete(false)
    setIsRecording(false)
    clearCanvas()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-orange-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-orange-500 p-3 rounded-xl">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Draw and Tell</h1>
                <p className="text-sm text-gray-600">Draw pictures and create stories</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🎨 What would you like to draw?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                    selectedTopic === topic.id 
                      ? `${topic.color} ring-4 ring-orange-200 scale-105` 
                      : `${topic.color} hover:scale-105`
                  }`}
                >
                  <div className="text-4xl mb-3">{topic.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900">{topic.title}</h3>
                </button>
              ))}
            </div>

            {/* Custom Topic Input */}
            {selectedTopic === 'custom' && (
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Please enter your custom topic:
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. My favorite food, My dream vacation..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg focus:border-orange-400 focus:outline-none"
                />
              </div>
            )}

            {/* Activity Description */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-orange-800 mb-3">🎯 Activity Instructions</h3>
              <div className="space-y-2 text-orange-700">
                <p>• Draw a picture related to your chosen topic</p>
                <p>• Use different colors and brush sizes to create your artwork</p>
                <p>• Create a story based on your drawing</p>
                <p>• Be creative and have fun!</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setCurrentStep(2)
                  // Initialize canvas
                  setTimeout(() => {
                    const canvas = canvasRef.current
                    if (canvas) {
                      const ctx = canvas.getContext('2d')
                      if (ctx) {
                        ctx.fillStyle = '#FFFFFF'
                        ctx.fillRect(0, 0, canvas.width, canvas.height)
                      }
                    }
                  }, 100)
                }}
                disabled={!selectedTopic || (selectedTopic === 'custom' && !customTopic.trim())}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
              >
                Start Drawing 🎨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Drawing */}
        {currentStep === 2 && (
          <div className="space-y-8">
            {/* Drawing Tools */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-orange-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                🎨 Draw your picture
              </h2>

              {/* Color Selection */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3">Select a color:</h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCurrentColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentColor === color ? 'border-gray-800 ring-2 ring-orange-300' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Brush Size */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Brush size:</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8">{brushSize}px</span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-orange-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Draw your picture</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={clearCanvas}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </button>
                  <button
                    onClick={saveDrawing}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                </div>
              </div>

              <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={400}
                  className="block mx-auto cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>

              <p className="text-sm text-gray-600 mt-2 text-center">
                Use your mouse to draw your picture. Click the save button to proceed to the next step.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Story Creation */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-100">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              📝 Create a story based on your drawing
            </h2>

            {/* Drawing Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Your drawing:</h3>
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden w-fit mx-auto">
                <canvas
                  width={300}
                  height={200}
                  className="block"
                  ref={(canvas) => {
                    if (canvas && canvasRef.current) {
                      const ctx = canvas.getContext('2d')
                      const sourceCtx = canvasRef.current.getContext('2d')
                      if (ctx && sourceCtx) {
                        ctx.drawImage(canvasRef.current, 0, 0, 300, 200)
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Story Creation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create your story:</h3>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center px-4 py-2 rounded-lg font-semibold ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
              </div>

              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Write a story based on your drawing..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg resize-none focus:border-orange-400 focus:outline-none"
                rows={8}
              />

              <div className="text-center">
                <button
                  onClick={handleStorySubmit}
                  disabled={!userStory.trim()}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
                >
                  Submit Your Story ✨
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Completion */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-100 text-center">
            <div className="mb-8">
              <div className="bg-orange-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 Congratulations! You have completed the activity!</h2>
              <p className="text-xl text-gray-600">You have improved your creativity and storytelling skills!</p>
            </div>

            {/* Completed Work */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-orange-800 mb-4">🎨 Your Completed Work</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Drawing */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Your drawing:</h4>
                  <div className="border-2 border-gray-300 rounded-xl overflow-hidden">
                    <canvas
                      width={250}
                      height={167}
                      className="block mx-auto"
                      ref={(canvas) => {
                        if (canvas && canvasRef.current) {
                          const ctx = canvas.getContext('2d')
                          const sourceCtx = canvasRef.current.getContext('2d')
                          if (ctx && sourceCtx) {
                            ctx.drawImage(canvasRef.current, 0, 0, 250, 167)
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Story */}
                <div className="text-left">
                  <h4 className="text-lg font-semibold mb-3">Your story:</h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-800 leading-relaxed">
                    {userStory}
                  </div>
                </div>
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
                onClick={resetActivity}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Restart
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
