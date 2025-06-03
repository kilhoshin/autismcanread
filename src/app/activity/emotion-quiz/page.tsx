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
    { id: 'school-day', title: '학교에서의 하루', emoji: '🏫', color: 'bg-blue-100 border-blue-300' },
    { id: 'friendship', title: '친구와의 우정', emoji: '👫', color: 'bg-green-100 border-green-300' },
    { id: 'family-time', title: '가족과 함께', emoji: '👨‍👩‍👧‍👦', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'pet-story', title: '반려동물 이야기', emoji: '🐕', color: 'bg-purple-100 border-purple-300' },
    { id: 'challenge', title: '어려운 상황 극복', emoji: '💪', color: 'bg-red-100 border-red-300' },
    { id: 'custom', title: '직접 입력', emoji: '✏️', color: 'bg-gray-100 border-gray-300' }
  ]

  const emotions: EmotionOption[] = [
    { emotion: '기쁨', emoji: '😊', color: 'bg-yellow-400', description: '행복하고 즐거운 감정' },
    { emotion: '슬픔', emoji: '😢', color: 'bg-blue-400', description: '슬프고 우울한 감정' },
    { emotion: '화남', emoji: '😠', color: 'bg-red-400', description: '화나고 짜증나는 감정' },
    { emotion: '놀람', emoji: '😲', color: 'bg-purple-400', description: '깜짝 놀라는 감정' },
    { emotion: '두려움', emoji: '😨', color: 'bg-gray-500', description: '무섭고 두려운 감정' },
    { emotion: '사랑', emoji: '🥰', color: 'bg-pink-400', description: '따뜻하고 사랑하는 감정' }
  ]

  const generateStory = async () => {
    // 샘플 데이터 (실제로는 API 호출)
    const sampleStory = {
      story: `지민이는 오늘 아침에 학교에 갔습니다. 
      교실에 들어가니 친구들이 모두 지민이를 바라보며 "생일 축하해!"라고 외쳤습니다. 
      지민이는 자신의 생일을 깜빡 잊고 있었어요. 
      친구들이 몰래 준비한 케이크와 선물을 보며 지민이는 정말 감동받았습니다. 
      하지만 케이크를 자르려는 순간 실수로 바닥에 떨어뜨리고 말았어요.
      친구들은 괜찮다며 웃어주었고, 선생님도 새로운 케이크를 가져다 주셨습니다.`,
      questions: [
        {
          scenario: '친구들이 "생일 축하해!"라고 외쳤을 때 지민이의 감정은?',
          correctEmotion: '놀람',
          explanation: '지민이는 자신의 생일을 깜빡했기 때문에 친구들의 축하를 받고 깜짝 놀랐을 거예요.'
        },
        {
          scenario: '케이크와 선물을 받았을 때 지민이의 감정은?',
          correctEmotion: '사랑',
          explanation: '친구들이 몰래 준비해준 것을 보고 감동받았다고 했으니 따뜻한 사랑의 감정을 느꼈을 거예요.'
        },
        {
          scenario: '케이크를 바닥에 떨어뜨렸을 때 지민이의 감정은?',
          correctEmotion: '슬픔',
          explanation: '소중한 케이크를 실수로 떨어뜨렸으니 속상하고 슬펐을 거예요.'
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
                <h1 className="text-2xl font-bold text-gray-900">감정 예측 퀴즈</h1>
                <p className="text-sm text-gray-600">등장인물의 감정 이해하기</p>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              😊 어떤 감정 이야기를 읽어볼까요?
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

            {/* 감정 유형 안내 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-center mb-4 text-gray-900">🎭 알아볼 감정들</h3>
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
                감정 이야기 만들기 ✨
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 스토리 생성 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">AI가 감정 이야기를 만들고 있어요!</h2>
            <button
              onClick={generateStory}
              className="bg-gradient-to-r from-yellow-500 to-pink-600 hover:from-yellow-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-xl transition-all"
            >
              이야기 생성하기
            </button>
          </div>
        )}

        {/* Step 3: 퀴즈 풀기 */}
        {currentStep === 3 && storyContent && currentQuestion && (
          <div className="space-y-8">
            {/* 이야기 읽기 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100">
              <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">📖 이야기를 읽고 감정을 예측해보세요</h2>
              <div className="bg-gray-50 p-6 rounded-xl text-lg leading-relaxed text-gray-800 mb-4">
                {storyContent.story}
              </div>
              
              {/* 진행 상황 */}
              <div className="text-center">
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                  문제 {currentQuestionIndex + 1} / {storyContent.questions.length}
                </span>
              </div>
            </div>

            {/* 감정 예측 문제 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100">
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-900">
                🤔 {currentQuestion.scenario}
              </h3>

              {!showExplanation ? (
                <>
                  {/* 감정 선택 */}
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
                      답 확인하기
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* 정답 확인 및 설명 */}
                  <div className={`p-6 rounded-xl mb-6 ${
                    isCorrect ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'
                  }`}>
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">
                        {isCorrect ? '🎉' : '💪'}
                      </div>
                      <h4 className={`text-2xl font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? '정답이에요!' : '다시 생각해봐요!'}
                      </h4>
                    </div>
                    
                    <div className="text-center mb-4">
                      <span className="text-lg font-semibold text-gray-700">정답: </span>
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
                      {currentQuestionIndex === storyContent.questions.length - 1 ? '결과 보기 🎊' : '다음 문제'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {currentStep === 4 && storyContent && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-yellow-100 text-center">
            <div className="mb-8">
              <div className="bg-green-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">🎉 감정 퀴즈를 완료했어요!</h2>
              <p className="text-xl text-gray-600">등장인물의 감정을 잘 이해했네요!</p>
            </div>

            {/* 결과 요약 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900">📊 퀴즈 결과</h3>
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
                      <div className="font-bold">문제 {index + 1}</div>
                      <div className="text-sm">{question.correctEmotion}</div>
                      <div className={`text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? '✅ 정답' : '❌ 틀림'}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-6 text-2xl font-bold text-gray-900">
                정답률: {Math.round((userAnswers.filter((answer, index) => 
                  answer === storyContent.questions[index].correctEmotion
                ).length / storyContent.questions.length) * 100)}%
              </div>
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
                  setUserAnswers([])
                  setCurrentQuestionIndex(0)
                  setSelectedEmotion('')
                  setShowExplanation(false)
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center"
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
