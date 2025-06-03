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
    { id: 'playground', title: '놀이터에서', emoji: '🛝', color: 'bg-blue-100 border-blue-300' },
    { id: 'restaurant', title: '식당에서', emoji: '🍽️', color: 'bg-orange-100 border-orange-300' },
    { id: 'library', title: '도서관에서', emoji: '📚', color: 'bg-green-100 border-green-300' },
    { id: 'market', title: '시장에서', emoji: '🛒', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'hospital', title: '병원에서', emoji: '🏥', color: 'bg-red-100 border-red-300' },
    { id: 'custom', title: '직접 입력', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const whTypes = [
    { 
      type: 'WHO', 
      korean: '누가', 
      color: 'bg-red-500', 
      description: '사람이나 동물을 찾아보세요',
      icon: '👥'
    },
    { 
      type: 'WHAT', 
      korean: '무엇을', 
      color: 'bg-blue-500', 
      description: '행동이나 물건을 찾아보세요',
      icon: '❓'
    },
    { 
      type: 'WHEN', 
      korean: '언제', 
      color: 'bg-green-500', 
      description: '시간을 찾아보세요',
      icon: '⏰'
    },
    { 
      type: 'WHERE', 
      korean: '어디서', 
      color: 'bg-yellow-500', 
      description: '장소를 찾아보세요',
      icon: '📍'
    },
    { 
      type: 'WHY', 
      korean: '왜', 
      color: 'bg-purple-500', 
      description: '이유를 찾아보세요',
      icon: '🤔'
    },
    { 
      type: 'HOW', 
      korean: '어떻게', 
      color: 'bg-pink-500', 
      description: '방법을 찾아보세요',
      icon: '🔧'
    }
  ]

  const generateStory = async () => {
    // 샘플 데이터로 대체 (실제로는 API 호출)
    const sampleStory = {
      story: `민수는 어제 오후 3시에 친구들과 함께 새로 생긴 놀이터에 갔습니다. 
      놀이터에는 큰 미끄럼틀과 그네가 있었어요. 
      민수는 친구들과 술래잡기를 하며 즐겁게 놀았습니다. 
      날씨가 너무 더워서 아이스크림을 사 먹기로 했어요. 
      모두 함께 근처 편의점에 가서 시원한 아이스크림을 샀습니다.`,
      questions: [
        { type: 'WHO', question: '놀이터에 간 사람은 누구인가요?', hint: '이름이 나와있어요' },
        { type: 'WHAT', question: '아이들이 놀이터에서 한 놀이는 무엇인가요?', hint: '뛰어다니는 놀이예요' },
        { type: 'WHEN', question: '놀이터에 간 시간은 언제인가요?', hint: '하루 중 시간을 찾아보세요' },
        { type: 'WHERE', question: '아이들이 놀고 있는 장소는 어디인가요?', hint: '미끄럼틀이 있는 곳이에요' },
        { type: 'WHY', question: '아이스크림을 사 먹은 이유는 무엇인가요?', hint: '날씨와 관련이 있어요' },
        { type: 'HOW', question: '아이스크림을 어떻게 구했나요?', hint: '어디서 샀는지 찾아보세요' }
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
                <h1 className="text-2xl font-bold text-gray-900">WH 질문 카드 훈련</h1>
                <p className="text-sm text-gray-600">누가, 무엇을, 언제, 어디서, 왜, 어떻게</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              ❓ 어떤 상황의 이야기로 연습할까요?
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

            {/* WH 질문 유형 안내 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-center mb-4 text-gray-900">🎯 연습할 질문 유형들</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {whTypes.map((wh) => (
                  <div key={wh.type} className={`${wh.color} text-white p-4 rounded-lg text-center`}>
                    <div className="text-2xl mb-1">{wh.icon}</div>
                    <div className="font-bold">{wh.korean} ({wh.type})</div>
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
                이야기 만들기 ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 스토리 생성 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI가 WH 질문 연습용 이야기를 만들고 있어요!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              이야기 생성하기
            </button>
          </div>
        )}

        {/* Step 3: 질문 답하기 */}
        {currentStep === 3 && storyContent && currentQuestion && (
          <div className="space-y-8">
            {/* 이야기 읽기 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">📖 이야기를 읽고 질문에 답해보세요</h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-6">
                {storyContent.story}
              </div>
              
              {/* 진행 상황 */}
              <div className="text-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                  질문 {currentQuestionIndex + 1} / {storyContent.questions.length}
                </span>
              </div>
            </div>

            {/* 현재 질문 */}
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
                    {currentQuestion.question}
                  </label>
                  <textarea
                    value={userAnswers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                    className="w-full p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg resize-none h-32"
                    placeholder="이야기를 다시 읽고 답을 찾아보세요..."
                  />
                  
                  {/* 힌트 */}
                  <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-yellow-800">
                      💡 <strong>힌트:</strong> {currentQuestion.hint}
                    </p>
                  </div>
                </div>

                {/* 네비게이션 버튼 */}
                <div className="flex justify-between">
                  <button
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                  >
                    이전 질문
                  </button>
                  
                  <button
                    onClick={nextQuestion}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    {currentQuestionIndex === storyContent.questions.length - 1 ? '완료하기 🎉' : '다음 질문'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: 완료 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-blue-100 text-center">
            <div className="mb-8">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 WH 질문 연습을 완료했어요!</h2>
              <p className="text-xl text-gray-600">모든 질문에 잘 답했네요! 이야기 이해력이 늘었어요.</p>
            </div>

            {/* 결과 요약 */}
            <div className="mb-8 grid md:grid-cols-3 gap-4">
              {whTypes.map((wh, index) => (
                <div key={wh.type} className={`${wh.color} text-white p-4 rounded-xl`}>
                  <div className="text-2xl mb-2">{wh.icon}</div>
                  <div className="font-bold">{wh.korean}</div>
                  <div className="text-sm opacity-90">
                    {userAnswers[index] ? '✅ 답변 완료' : '❌ 미완료'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {/* TODO: PDF 생성 */}}
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
                  setUserAnswers({})
                  setCurrentQuestionIndex(0)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
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
