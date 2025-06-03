'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Book, ArrowLeft, Download, RefreshCw, CheckCircle, Edit3, Lightbulb, ArrowRight } from 'lucide-react'

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
    { id: 'daily-routine', title: '일상 생활', emoji: '🏠', color: 'bg-blue-100 border-blue-300' },
    { id: 'food-cooking', title: '음식과 요리', emoji: '🍳', color: 'bg-orange-100 border-orange-300' },
    { id: 'seasons-weather', title: '계절과 날씨', emoji: '🌤️', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'animals-nature', title: '동물과 자연', emoji: '🐼', color: 'bg-green-100 border-green-300' },
    { id: 'friendship', title: '친구와 우정', emoji: '👫', color: 'bg-pink-100 border-pink-300' },
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
          activityType: 'sentence-completion',
          readingLevel: 3,
          writingLevel: 3,
          topic: selectedTopic
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStoryContent(data.content)
        setUserAnswers(new Array(data.content.blanks.length).fill(''))
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
      title: '즐거운 하루',
      story: `오늘은 일요일이라서 가족과 함께 공원에 갔어요. 공원에는 예쁜 꽃들이 많이 피어있었습니다. 아이들은 놀이터에서 신나게 놀았어요. 점심에는 도시락을 먹으면서 이야기를 나누었습니다. 오후에는 호수에서 오리들을 구경했어요. 정말 즐거운 하루였습니다.`,
      blanks: [
        {
          id: 1,
          original: '오늘은 일요일이라서 가족과 함께 공원에 갔어요.',
          withBlank: '오늘은 ______이라서 가족과 함께 공원에 갔어요.',
          answer: '일요일'
        },
        {
          id: 2,
          original: '공원에는 예쁜 꽃들이 많이 피어있었습니다.',
          withBlank: '공원에는 예쁜 ______이 많이 피어있었습니다.',
          answer: '꽃들'
        },
        {
          id: 3,
          original: '아이들은 놀이터에서 신나게 놀았어요.',
          withBlank: '아이들은 ______에서 신나게 놀았어요.',
          answer: '놀이터'
        },
        {
          id: 4,
          original: '점심에는 도시락을 먹으면서 이야기를 나누었습니다.',
          withBlank: '점심에는 ______을 먹으면서 이야기를 나누었습니다.',
          answer: '도시락'
        },
        {
          id: 5,
          original: '오후에는 호수에서 오리들을 구경했어요.',
          withBlank: '오후에는 호수에서 ______을 구경했어요.',
          answer: '오리들'
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
          link.download = `문장완성하기_${new Date().toLocaleDateString('ko-KR')}.pdf`
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
                <h1 className="text-2xl font-bold text-gray-900">문장 완성하기</h1>
                <p className="text-sm text-gray-600">빈칸에 알맞은 단어 넣기</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              ✏️ 어떤 주제로 문장을 완성해볼까요?
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

            {/* 활동 설명 */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-indigo-800 mb-3">🎯 활동 방법</h3>
              <div className="space-y-2 text-indigo-700">
                <p>• 이야기를 읽고 빈칸에 들어갈 단어를 생각해보세요</p>
                <p>• 문맥을 파악하여 알맞은 단어를 찾아보세요</p>
                <p>• 한 문제씩 차근차근 풀어나가세요</p>
                <p>• 모든 빈칸을 채우면 점수를 확인할 수 있어요</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedTopic}
                className="bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                문장 완성 문제 만들기 ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 스토리 생성 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI가 문장 완성 문제를 만들고 있어요!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              문제 생성하기
            </button>
          </div>
        )}

        {/* Step 3: 문장 완성하기 */}
        {currentStep === 3 && storyContent && (
          <div className="space-y-8">
            {/* 원본 이야기 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
                📖 이야기를 읽고 빈칸을 채워보세요
              </h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-4">
                {storyContent.story}
              </div>
              <div className="text-center text-gray-600">
                위 이야기에서 일부 단어가 빈칸으로 되어있어요. 문맥을 파악해서 알맞은 단어를 넣어보세요!
              </div>
            </div>

            {/* 문제 풀이 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  ✏️ 문제 {currentBlankIndex + 1} / {storyContent.blanks.length}
                </h3>
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showHints ? '힌트 숨기기' : '힌트 보기'}
                </button>
              </div>

              {/* 현재 문제 */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
                <div className="text-lg text-gray-800 mb-4 leading-relaxed">
                  {storyContent.blanks[currentBlankIndex]?.withBlank}
                </div>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={userAnswers[currentBlankIndex] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="빈칸에 들어갈 단어를 입력하세요"
                    className="flex-1 p-4 border-2 border-indigo-300 rounded-xl text-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* 힌트 */}
                {showHints && (
                  <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2">💡 힌트</h4>
                    <p className="text-yellow-700">
                      원래 문장: {storyContent.blanks[currentBlankIndex]?.original}
                    </p>
                  </div>
                )}
              </div>

              {/* 네비게이션 */}
              <div className="flex justify-between items-center">
                <button
                  onClick={goToPrevBlank}
                  disabled={currentBlankIndex === 0}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 이전 문제
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
                    완료하기 ✅
                  </button>
                ) : (
                  <button
                    onClick={goToNextBlank}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
                  >
                    다음 문제 <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 결과 확인 */}
        {currentStep === 4 && storyContent && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-indigo-100">
            <div className="text-center mb-8">
              <div className="bg-indigo-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 문장 완성하기를 완료했어요!</h2>
              <div className="text-2xl font-bold text-indigo-600 mb-2">점수: {getScore()}점</div>
              <p className="text-xl text-gray-600">어휘력과 문맥 파악 능력이 늘었어요!</p>
            </div>

            {/* 결과 상세 */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-indigo-800 mb-4">📝 답안 확인</h3>
              <div className="space-y-4">
                {storyContent.blanks.map((blank, index) => {
                  const isCorrect = userAnswers[index]?.trim().toLowerCase() === blank.answer.toLowerCase()
                  return (
                    <div key={blank.id} className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">문제 {index + 1}</span>
                        <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {isCorrect ? '✓ 정답' : '✗ 오답'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-2">{blank.withBlank}</div>
                      <div className="flex justify-between text-sm">
                        <span>내 답: <strong>{userAnswers[index] || '(미입력)'}</strong></span>
                        <span>정답: <strong>{blank.answer}</strong></span>
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
                PDF 다운로드
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
