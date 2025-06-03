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
    { id: 'cooking', title: '요리하기', emoji: '👩‍🍳', color: 'bg-orange-100 border-orange-300' },
    { id: 'morning-routine', title: '아침 준비하기', emoji: '🌅', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'cleaning-room', title: '방 정리하기', emoji: '🧹', color: 'bg-blue-100 border-blue-300' },
    { id: 'plant-care', title: '식물 기르기', emoji: '🌱', color: 'bg-green-100 border-green-300' },
    { id: 'homework', title: '숙제하기', emoji: '📝', color: 'bg-purple-100 border-purple-300' },
    { id: 'custom', title: '직접 입력', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
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
        // 문장들을 섞어서 초기 순서 설정
        const shuffled = [...data.content.sentences].sort(() => Math.random() - 0.5)
        setUserOrder(shuffled)
        setCurrentStep(3)
      } else {
        console.error('AI 스토리 생성 실패')
        // 실패 시 샘플 데이터 사용
        useSampleData()
      }
    } catch (error) {
      console.error('AI API 호출 오류:', error)
      // 오류 시 샘플 데이터 사용
      useSampleData()
    }
  }

  const useSampleData = () => {
    // 샘플 데이터 (AI API 실패 시 대체용)
    const sampleStory = {
      title: '라면 끓이기',
      story: `민수는 배가 고파서 라면을 끓이기로 했습니다. 
      먼저 냄비에 물을 넣고 끓였어요. 
      물이 끓으면 라면과 스프를 넣었습니다. 
      3분 동안 끓인 후 맛있게 먹었어요.`,
      sentences: [
        { id: 1, text: '맛있게 라면을 먹었어요.', correctOrder: 4 },
        { id: 2, text: '냄비에 물을 넣고 끓였어요.', correctOrder: 1 },
        { id: 3, text: '라면과 스프를 넣었습니다.', correctOrder: 3 },
        { id: 4, text: '3분 동안 끓였어요.', correctOrder: 4 },
        { id: 5, text: '물이 끓을 때까지 기다렸어요.', correctOrder: 2 }
      ]
    }
    
    setStoryContent(sampleStory)
    // 문장들을 섞어서 초기 순서 설정
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
    
    // 드래그된 아이템 제거
    newOrder.splice(draggedItem, 1)
    // 새 위치에 삽입
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
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'sentence-order',
          storyContent: storyContent?.story,
          userAnswers: {
            userOrder,
            correctOrder: storyContent?.sentences.sort((a, b) => a.correctOrder - b.correctOrder),
            isCorrect: isCorrectOrder
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.pdfData) {
          // PDF 다운로드
          const link = document.createElement('a')
          link.href = data.pdfData
          link.download = `문장순서맞추기_${new Date().toLocaleDateString('ko-KR')}.pdf`
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
                <h1 className="text-2xl font-bold text-gray-900">문장 순서 바꾸기</h1>
                <p className="text-sm text-gray-600">올바른 순서로 문장 배열하기</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🔄 어떤 순서 이야기를 연습할까요?
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

            {/* 활동 설명 */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-green-800 mb-3">🎯 활동 방법</h3>
              <div className="space-y-2 text-green-700">
                <p>• 이야기를 읽고 순서가 섞인 문장들을 확인해요</p>
                <p>• 드래그하거나 버튼을 눌러서 올바른 순서로 배열해요</p>
                <p>• 시간 순서와 논리적 흐름을 생각해보세요</p>
                <p>• 완성되면 정답을 확인할 수 있어요</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                순서 이야기 만들기 ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 스토리 생성 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI가 순서 이야기를 만들고 있어요!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              이야기 생성하기
            </button>
          </div>
        )}

        {/* Step 3: 문장 순서 맞추기 */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* 원래 이야기 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                📖 이야기를 읽고 문장 순서를 맞춰보세요
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-4">
                {storyContent.story}
              </div>
              <p className="text-center text-gray-600">
                위 이야기의 문장들이 아래에 섞여있어요. 올바른 순서로 배열해보세요!
              </p>
            </div>

            {/* 문장 순서 맞추기 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">🔄 문장 순서 맞추기</h3>
                <button
                  onClick={resetOrder}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 섞기
                </button>
              </div>

              {/* 순서가 섞인 문장들 */}
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
                    {/* 순서 번호 */}
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                      {index + 1}
                    </div>

                    {/* 드래그 핸들 */}
                    <div className="flex-shrink-0 mr-4 text-gray-400">
                      <GripVertical className="w-6 h-6" />
                    </div>

                    {/* 문장 텍스트 */}
                    <div className="flex-1 text-lg text-gray-800">
                      {sentence.text}
                    </div>

                    {/* 이동 버튼들 */}
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

                    {/* 정답 표시 */}
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

              {/* 정답 확인 버튼 */}
              {!isComplete ? (
                <div className="text-center">
                  <button
                    onClick={checkAnswer}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
                  >
                    정답 확인하기 ✅
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
                    {isCorrectOrder ? '완벽해요!' : '다시 한번 도전해보세요!'}
                  </h4>
                  <p className="text-lg text-gray-700 mb-6">
                    {isCorrectOrder 
                      ? '모든 문장의 순서를 올바르게 맞췄어요!' 
                      : '빨간색 문장들의 위치를 다시 확인해보세요.'
                    }
                  </p>

                  <div className="flex justify-center space-x-4">
                    {isCorrectOrder ? (
                      <>
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
                        >
                          완료하기 🎊
                        </button>
                        <button
                          onClick={downloadPDF}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          PDF 다운로드
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsComplete(false)}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        다시 시도하기
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-green-100 text-center">
            <div className="mb-8">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 문장 순서 맞추기를 완료했어요!</h2>
              <p className="text-xl text-gray-600">논리적 사고력과 순서 파악 능력이 늘었어요!</p>
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
                다시하기
              </button>
              <Link
                href="/dashboard"
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
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
