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
    { id: 'family', title: '우리 가족', emoji: '👨‍👩‍👧‍👦', color: 'bg-pink-100 border-pink-300' },
    { id: 'pet', title: '내 애완동물', emoji: '🐕', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'friend', title: '내 친구', emoji: '👫', color: 'bg-blue-100 border-blue-300' },
    { id: 'school', title: '학교 생활', emoji: '🏫', color: 'bg-green-100 border-green-300' },
    { id: 'dream', title: '내 꿈', emoji: '🌟', color: 'bg-purple-100 border-purple-300' },
    { id: 'custom', title: '직접 입력', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
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
    // 흰색 배경 설정
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL('image/png')
    console.log('그림 저장됨:', imageData.substring(0, 50) + '...')
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
    // 실제 음성 녹음 기능은 나중에 구현
    if (!isRecording) {
      alert('음성 녹음 기능은 개발 중입니다. 텍스트로 이야기를 작성해주세요.')
    }
  }

  const downloadPDF = async () => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const imageData = canvas.toDataURL('image/png')
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'draw-and-tell',
          storyContent: userStory,
          userAnswers: {
            topic: selectedTopic === 'custom' ? customTopic : topics.find(t => t.id === selectedTopic)?.title,
            imageData,
            story: userStory
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.pdfData) {
          const link = document.createElement('a')
          link.href = data.pdfData
          link.download = `그림그리고말하기_${new Date().toLocaleDateString('ko-KR')}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        console.error('PDF 생성 실패')
        alert('PDF 생성에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      console.error('PDF 다운로드 오류:', error)
      alert('PDF 다운로드 중 오류가 발생했습니다.')
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
                <h1 className="text-2xl font-bold text-gray-900">그림 그리고 말하기</h1>
                <p className="text-sm text-gray-600">그림을 그리고 이야기 만들기</p>
              </div>
            </Link>
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: 주제 선택 */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🎨 무엇을 그려볼까요?
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

            {/* 커스텀 주제 입력 */}
            {selectedTopic === 'custom' && (
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  그리고 싶은 주제를 입력해주세요:
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="예: 내가 좋아하는 음식, 가고 싶은 여행지..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg focus:border-orange-400 focus:outline-none"
                />
              </div>
            )}

            {/* 활동 설명 */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-orange-800 mb-3">🎯 활동 방법</h3>
              <div className="space-y-2 text-orange-700">
                <p>• 선택한 주제에 대한 그림을 자유롭게 그려보세요</p>
                <p>• 다양한 색깔과 붓 크기를 사용할 수 있어요</p>
                <p>• 그린 그림에 대한 이야기를 만들어보세요</p>
                <p>• 창의적으로 표현하는 것이 중요해요</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setCurrentStep(2)
                  // 캔버스 초기화
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
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                그림 그리러 가기 🎨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 그림 그리기 */}
        {currentStep === 2 && (
          <div className="space-y-8">
            {/* 그리기 도구 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-orange-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                🎨 {selectedTopic === 'custom' ? customTopic : topics.find(t => t.id === selectedTopic)?.title}를 그려보세요
              </h2>

              {/* 색상 선택 */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3">색상 선택:</h3>
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

              {/* 붓 크기 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">붓 크기:</h3>
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

            {/* 캔버스 */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-orange-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">그림 그리기</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={clearCanvas}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    지우기
                  </button>
                  <button
                    onClick={saveDrawing}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    완료
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
                마우스를 이용해 그림을 그려보세요. 완료 버튼을 누르면 다음 단계로 넘어갑니다.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: 이야기 작성 */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-100">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
              📝 그림에 대한 이야기를 만들어보세요
            </h2>

            {/* 그린 그림 미리보기 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">내가 그린 그림:</h3>
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

            {/* 이야기 작성 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">이야기 작성:</h3>
                <button
                  onClick={toggleRecording}
                  className={`flex items-center px-4 py-2 rounded-lg font-semibold ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isRecording ? '녹음 중지' : '음성 입력'}
                </button>
              </div>

              <textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="그림에 대한 이야기를 자유롭게 써보세요..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg resize-none focus:border-orange-400 focus:outline-none"
                rows={8}
              />

              <div className="text-center">
                <button
                  onClick={handleStorySubmit}
                  disabled={!userStory.trim()}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50"
                >
                  이야기 완성하기 ✨
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-100 text-center">
            <div className="mb-8">
              <div className="bg-orange-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 그림 그리고 말하기를 완료했어요!</h2>
              <p className="text-xl text-gray-600">창의력과 표현력이 늘었어요!</p>
            </div>

            {/* 완성작 보기 */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-orange-800 mb-4">🎨 완성작</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* 그림 */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">내가 그린 그림:</h4>
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

                {/* 이야기 */}
                <div className="text-left">
                  <h4 className="text-lg font-semibold mb-3">내가 만든 이야기:</h4>
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
                PDF 다운로드
              </button>
              <button
                onClick={resetActivity}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                다시하기
              </button>
              <Link
                href="/dashboard"
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                대시보드로
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
