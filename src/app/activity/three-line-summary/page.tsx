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
    { id: 'school-day', title: '학교에서의 하루', emoji: '🏫', color: 'bg-blue-100 border-blue-300' },
    { id: 'family-trip', title: '가족 여행', emoji: '✈️', color: 'bg-green-100 border-green-300' },
    { id: 'pet-story', title: '애완동물 이야기', emoji: '🐕', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'birthday-party', title: '생일 파티', emoji: '🎂', color: 'bg-pink-100 border-pink-300' },
    { id: 'nature-walk', title: '자연 산책', emoji: '🌳', color: 'bg-green-100 border-green-300' },
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
        console.error('AI 스토리 생성 실패')
        useSampleData()
      }
    } catch (error) {
      console.error('AI API 호출 오류:', error)
      useSampleData()
    }
  }

  const useSampleData = () => {
    const sampleStory = {
      title: '학교에서의 즐거운 하루',
      story: `오늘은 민준이의 생일이었습니다. 아침에 엄마가 맛있는 미역국을 끓여주셨어요. 학교에 가니 친구들이 "생일 축하해!"라고 말해주었습니다. 점심시간에는 선생님이 케이크를 준비해주셨어요. 모든 친구들이 함께 생일 노래를 불러주었습니다. 민준이는 소원을 빌고 촛불을 껐어요. 친구들과 맛있는 케이크를 나눠 먹었습니다. 집에 돌아와서는 가족들과 함께 저녁을 먹고 선물을 받았어요. 민준이는 정말 행복한 하루를 보냈습니다.`,
      summaryGuide: [
        '민준이의 생일이었고 아침에 미역국을 먹었다',
        '학교에서 친구들과 선생님이 생일을 축하해주고 케이크를 먹었다',
        '집에서 가족과 함께 저녁을 먹고 선물을 받아서 행복했다'
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
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'three-line-summary',
          storyContent: storyContent?.story,
          userAnswers: {
            userSummary,
            summaryGuide: storyContent?.summaryGuide
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.pdfData) {
          const link = document.createElement('a')
          link.href = data.pdfData
          link.download = `세줄요약하기_${new Date().toLocaleDateString('ko-KR')}.pdf`
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
                <h1 className="text-2xl font-bold text-gray-900">세줄 요약하기</h1>
                <p className="text-sm text-gray-600">이야기의 핵심 내용 정리하기</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              📝 어떤 이야기를 요약해볼까요?
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

            {/* 활동 설명 */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-purple-800 mb-3">🎯 활동 방법</h3>
              <div className="space-y-2 text-purple-700">
                <p>• 이야기를 읽고 내용을 파악해요</p>
                <p>• 중요한 내용을 찾아서 3줄로 요약해요</p>
                <p>• 시작, 중간, 끝의 핵심 내용을 각각 한 줄씩 써보세요</p>
                <p>• 간단하고 명확하게 표현하는 것이 중요해요</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                요약할 이야기 만들기 ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 스토리 생성 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI가 요약할 이야기를 만들고 있어요!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              이야기 생성하기
            </button>
          </div>
        )}

        {/* Step 3: 이야기 읽고 요약하기 */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* 원래 이야기 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                📖 이야기를 읽고 3줄로 요약해보세요
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
                  {showGuide ? '힌트 숨기기' : '힌트 보기'}
                </button>
              </div>
              
              {/* 요약 가이드 (힌트) */}
              {showGuide && storyContent.summaryGuide && (
                <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-yellow-800 mb-3">💡 요약 힌트</h4>
                  <div className="space-y-2">
                    {storyContent.summaryGuide.map((guide, index) => (
                      <p key={index} className="text-yellow-700">
                        <strong>{index + 1}줄:</strong> {guide}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 요약 작성 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">✍️ 3줄 요약 작성하기</h3>
              
              <div className="space-y-6">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-2">
                    <label className="flex items-center text-lg font-semibold text-gray-700">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mr-3 text-sm">
                        {num}
                      </div>
                      {num}줄째 요약
                    </label>
                    <textarea
                      value={userSummary[num - 1]}
                      onChange={(e) => handleSummaryChange(num - 1, e.target.value)}
                      placeholder={`${num}줄째 요약을 작성해주세요...`}
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
                      요약 완료하기 ✅
                    </button>
                    <button
                      onClick={resetSummary}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      다시 작성
                    </button>
                  </>
                ) : (
                  <div className="bg-green-100 border-2 border-green-300 rounded-xl p-6 text-center w-full">
                    <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-2xl font-bold text-green-800 mb-2">요약을 완료했어요!</h4>
                    <p className="text-lg text-gray-700 mb-6">
                      이야기의 핵심 내용을 잘 정리했네요!
                    </p>

                    <div className="flex justify-center space-x-4">
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
                      <button
                        onClick={resetSummary}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        다시 요약하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-purple-100 text-center">
            <div className="mb-8">
              <div className="bg-purple-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 세줄 요약하기를 완료했어요!</h2>
              <p className="text-xl text-gray-600">읽기 이해력과 요약 능력이 늘었어요!</p>
            </div>

            {/* 완성된 요약 보기 */}
            {userSummary.some(line => line.trim() !== '') && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-purple-800 mb-4">📝 완성된 요약</h3>
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
                PDF 다운로드
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
