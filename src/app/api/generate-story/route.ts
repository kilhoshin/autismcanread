import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { activityType, readingLevel, writingLevel, topic } = await request.json()

    if (!activityType || !readingLevel || !writingLevel) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })
    const prompt = generatePrompt(activityType, readingLevel, writingLevel, topic)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const content = parseResponse(activityType, text)

    return NextResponse.json({
      success: true,
      content,
      activityType,
      topic
    })

  } catch (error) {
    console.error('Story generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate story' },
      { status: 500 }
    )
  }
}

interface WHQuestion {
  type: string
  question: string
  hint: string
}

interface EmotionQuestion {
  scenario: string
  correctEmotion: string
  explanation: string
}

interface BlankItem {
  id: number
  original: string
  withBlank: string
  answer: string
}

interface Sentence {
  id: number
  text: string
  correctOrder: number
}

function generatePrompt(activityType: string, readingLevel: number, writingLevel: number, topic: string): string {
  const baseInstructions = `
한국어로 ${readingLevel}학년 읽기 수준과 ${writingLevel}학년 쓰기 수준에 맞는 이야기를 만들어주세요.
- 문장은 간단하고 명확하게 작성
- 어휘는 해당 학년 수준에 적합하게
- 자폐/ADHD 아동이 이해하기 쉽도록 구체적이고 명확한 표현 사용
- 주제: ${topic}
`

  switch (activityType) {
    case 'bme-story':
      return `${baseInstructions}

B-M-E(Beginning-Middle-End) 구조가 명확한 이야기를 만들어주세요.
시작-중간-끝 부분이 뚜렷하게 구분되도록 작성해주세요.

응답 형식:
STORY:
[전체 이야기]

BEGINNING:
[시작 부분]

MIDDLE:
[중간 부분]

END:
[끝 부분]`

    case 'wh-questions':
      return `${baseInstructions}

WH 질문(누가, 무엇을, 언제, 어디서, 왜, 어떻게)에 답할 수 있는 정보가 포함된 이야기를 만들어주세요.

응답 형식:
STORY:
[전체 이야기]

QUESTIONS:
WHO: [누가에 대한 질문]
WHAT: [무엇을에 대한 질문]
WHEN: [언제에 대한 질문]
WHERE: [어디서에 대한 질문]
WHY: [왜에 대한 질문]
HOW: [어떻게에 대한 질문]

HINTS:
WHO: [누가 질문의 힌트]
WHAT: [무엇을 질문의 힌트]
WHEN: [언제 질문의 힌트]
WHERE: [어디서 질문의 힌트]
WHY: [왜 질문의 힌트]
HOW: [어떻게 질문의 힌트]`

    case 'emotion-quiz':
      return `${baseInstructions}

등장인물의 감정 변화가 있는 이야기를 만들어주세요.
기쁨, 슬픔, 화남, 놀람, 두려움, 사랑 등의 감정이 포함되도록 해주세요.

응답 형식:
STORY:
[전체 이야기]

QUESTIONS:
1. [첫 번째 상황]: [상황 설명]
ANSWER: [올바른 감정]
EXPLANATION: [설명]

2. [두 번째 상황]: [상황 설명]
ANSWER: [올바른 감정]
EXPLANATION: [설명]

3. [세 번째 상황]: [상황 설명]
ANSWER: [올바른 감정]
EXPLANATION: [설명]`

    case 'sentence-order':
      return generateSentenceOrderPrompt(readingLevel, writingLevel, topic)
    case 'three-line-summary':
      return generateThreeLineSummaryPrompt(readingLevel, writingLevel, topic)
    case 'sentence-completion':
      return generateSentenceCompletionPrompt(readingLevel, writingLevel, topic)
    case 'draw-and-tell':
      return generateDrawAndTellPrompt(readingLevel, writingLevel, topic)
    default:
      return generateWHQuestionsPrompt(readingLevel, writingLevel, topic)
  }
}

function generateThreeLineSummaryPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  return `
자폐 및 ADHD 아동을 위한 독해 활동용 이야기를 만들어주세요.

요구사항:
- 읽기 수준: ${readingLevel}학년 (1-5학년, 높을수록 어려움)
- 쓰기 수준: ${writingLevel}학년
- 주제: ${topic}
- 이야기 길이: 8-12문장
- 3줄 요약하기 활동에 적합한 명확한 구조 (시작-중간-끝)

다음 JSON 형식으로 응답해주세요:
{
  "title": "이야기 제목",
  "story": "전체 이야기 내용",
  "summaryGuide": [
    "첫 번째 줄 요약 가이드",
    "두 번째 줄 요약 가이드", 
    "세 번째 줄 요약 가이드"
  ]
}

이야기는 아동이 이해하기 쉽고, 시작-중간-끝 구조가 명확해야 합니다.
요약 가이드는 각 부분의 핵심 내용을 간단히 정리한 것입니다.`
}

function generateSentenceCompletionPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  return `
자폐 및 ADHD 아동을 위한 문장 완성하기 활동용 이야기를 만들어주세요.

요구사항:
- 읽기 수준: ${readingLevel}학년 (1-5학년, 높을수록 어려움)
- 쓰기 수준: ${writingLevel}학년
- 주제: ${topic}
- 이야기 길이: 6-8문장
- 5개의 빈칸 문제 포함

다음 JSON 형식으로 응답해주세요:
{
  "title": "이야기 제목",
  "story": "빈칸이 없는 완전한 이야기",
  "blanks": [
    {
      "id": 1,
      "original": "원래 문장",
      "withBlank": "빈칸이 있는 문장",
      "answer": "정답 단어"
    }
  ]
}

빈칸으로 만들 단어는 문맥상 중요하고 아동 수준에 맞는 어휘여야 합니다.
빈칸은 ______ 형태로 표시하세요.`
}

function generateDrawAndTellPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  return `
자폐 및 ADHD 아동을 위한 그림 그리고 말하기 활동용 가이드를 만들어주세요.

요구사항:
- 읽기 수준: ${readingLevel}학년 (1-5학년, 높을수록 어려움)
- 쓰기 수준: ${writingLevel}학년
- 주제: ${topic}
- 그리기와 이야기 만들기에 적합한 내용

다음 JSON 형식으로 응답해주세요:
{
  "title": "활동 제목",
  "story": "주제 설명 및 그리기 가이드",
  "drawingPrompts": [
    "그릴 수 있는 요소 1",
    "그릴 수 있는 요소 2",
    "그릴 수 있는 요소 3"
  ],
  "storyPrompts": [
    "이야기에 포함할 수 있는 내용 1",
    "이야기에 포함할 수 있는 내용 2",
    "이야기에 포함할 수 있는 내용 3"
  ]
}

아동이 자유롭게 창의적으로 표현할 수 있도록 구체적이면서도 유연한 가이드를 제공하세요.`
}

function generateSentenceOrderPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  return `
자폐 및 ADHD 아동을 위한 문장 순서 맞추기 활동용 이야기를 만들어주세요.

요구사항:
- 읽기 수준: ${readingLevel}학년 (1-5학년, 높을수록 어려움)
- 쓰기 수준: ${writingLevel}학년
- 주제: ${topic}
- 이야기 길이: 5-7문장
- 순서가 명확한 사건이나 과정

다음 JSON 형식으로 응답해주세요:
{
  "title": "이야기 제목",
  "story": "전체 이야기 내용",
  "sentences": [
    {
      "id": 1,
      "text": "문장 내용",
      "correctOrder": 1
    }
  ]
}

시간 순서나 논리적 순서가 명확하게 드러나는 이야기를 만드세요.`
}

function generateWHQuestionsPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  const baseInstructions = `다음 조건에 맞는 이야기를 만들어주세요:
- 자폐 및 ADHD 아동을 위한 읽기 이해력 향상 활동
- 읽기 수준: ${readingLevel}학년 (1-5학년, 높을수록 어려움)
- 쓰기 수준: ${writingLevel}학년
- 주제: ${topic}
- 이야기 길이: 8-12문장`

  return `${baseInstructions}

다음 JSON 형식으로 응답해주세요:
{
  "title": "이야기 제목",
  "story": "전체 이야기 내용",
  "questions": [
    {
      "id": 1,
      "question": "언제 일어난 일인가요?",
      "answer": "정답",
      "type": "when",
      "difficulty": 1
    }
  ]
}

육하원칙 질문(누가, 언제, 어디서, 무엇을, 어떻게, 왜)을 포함한 이야기와 질문을 만드세요.`
}

function parseResponse(activityType: string, text: string): any {
  switch (activityType) {
    case 'bme-story':
      return parseBMEStory(text)
    case 'wh-questions':
      return parseWHQuestions(text)
    case 'emotion-quiz':
      return parseEmotionQuiz(text)
    case 'sentence-order':
      return parseSentenceOrderResponse(text)
    case 'three-line-summary':
      return parseThreeLineSummaryResponse(text)
    case 'sentence-completion':
      return parseSentenceCompletionResponse(text)
    case 'draw-and-tell':
      return parseDrawAndTellResponse(text)
    default:
      return parseWHQuestionsResponse(text)
  }
}

function parseBMEStory(text: string) {
  const storyMatch = text.match(/STORY:\s*([\s\S]*?)(?=BEGINNING:|$)/i)
  const beginningMatch = text.match(/BEGINNING:\s*([\s\S]*?)(?=MIDDLE:|$)/i)
  const middleMatch = text.match(/MIDDLE:\s*([\s\S]*?)(?=END:|$)/i)
  const endMatch = text.match(/END:\s*([\s\S]*?)$/i)

  return {
    story: storyMatch?.[1]?.trim() || text,
    sections: {
      beginning: beginningMatch?.[1]?.trim() || '',
      middle: middleMatch?.[1]?.trim() || '',
      end: endMatch?.[1]?.trim() || ''
    }
  }
}

function parseWHQuestions(text: string) {
  const storyMatch = text.match(/STORY:\s*([\s\S]*?)(?=QUESTIONS:|$)/i)
  
  const questions: WHQuestion[] = []
  const whTypes = ['WHO', 'WHAT', 'WHEN', 'WHERE', 'WHY', 'HOW']
  
  whTypes.forEach(type => {
    const questionMatch = text.match(new RegExp(`${type}:\\s*([^\\n]+)`, 'i'))
    const hintMatch = text.match(new RegExp(`${type}:\\s*([^\\n]+)`, 'i'))
    
    if (questionMatch) {
      questions.push({
        type,
        question: questionMatch[1].trim(),
        hint: hintMatch?.[1]?.trim() || `${type.toLowerCase()} 관련 내용을 찾아보세요`
      })
    }
  })

  return {
    story: storyMatch?.[1]?.trim() || text,
    questions
  }
}

function parseEmotionQuiz(text: string) {
  const storyMatch = text.match(/STORY:\s*([\s\S]*?)(?=QUESTIONS:|$)/i)
  
  const questions: EmotionQuestion[] = []
  const questionMatches = text.matchAll(/(\d+)\.\s*([^:]+):\s*([^\n]+)\s*ANSWER:\s*([^\n]+)\s*EXPLANATION:\s*([^\n]+)/gi)
  
  for (const match of questionMatches) {
    questions.push({
      scenario: match[3].trim(),
      correctEmotion: match[4].trim(),
      explanation: match[5].trim()
    })
  }

  return {
    story: storyMatch?.[1]?.trim() || text,
    questions
  }
}

function parseSentenceOrderResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || '이야기 순서 맞추기',
      story: parsed.story || '이야기를 생성할 수 없습니다.',
      sentences: parsed.sentences || [
        {
          id: 1,
          text: '첫 번째 문장입니다.',
          correctOrder: 1
        }
      ]
    }
  } catch {
    return {
      title: '이야기 순서 맞추기',
      story: '파싱 오류로 샘플 이야기를 제공합니다.',
      sentences: [
        {
          id: 1,
          text: '첫 번째 문장입니다.',
          correctOrder: 1
        }
      ]
    }
  }
}

function parseThreeLineSummaryResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || '세줄 요약하기',
      story: parsed.story || '이야기를 생성할 수 없습니다.',
      summaryGuide: parsed.summaryGuide || [
        '첫 번째 줄 요약',
        '두 번째 줄 요약',
        '세 번째 줄 요약'
      ]
    }
  } catch {
    return {
      title: '세줄 요약하기',
      story: '파싱 오류로 샘플 이야기를 제공합니다.',
      summaryGuide: [
        '첫 번째 줄 요약',
        '두 번째 줄 요약',
        '세 번째 줄 요약'
      ]
    }
  }
}

function parseSentenceCompletionResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || '문장 완성하기',
      story: parsed.story || '이야기를 생성할 수 없습니다.',
      blanks: parsed.blanks || [
        {
          id: 1,
          original: '샘플 문장입니다.',
          withBlank: '샘플 ______입니다.',
          answer: '문장'
        }
      ]
    }
  } catch {
    return {
      title: '문장 완성하기',
      story: '파싱 오류로 샘플 이야기를 제공합니다.',
      blanks: [
        {
          id: 1,
          original: '샘플 문장입니다.',
          withBlank: '샘플 ______입니다.',
          answer: '문장'
        }
      ]
    }
  }
}

function parseDrawAndTellResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || '그림 그리고 말하기',
      story: parsed.story || '그림을 그리고 이야기를 만들어보세요.',
      drawingPrompts: parsed.drawingPrompts || [
        '주인공을 그려보세요',
        '배경을 그려보세요',
        '중요한 물건을 그려보세요'
      ],
      storyPrompts: parsed.storyPrompts || [
        '누가 등장하나요?',
        '어떤 일이 일어났나요?',
        '어떻게 끝났나요?'
      ]
    }
  } catch {
    return {
      title: '그림 그리고 말하기',
      story: '파싱 오류로 샘플 가이드를 제공합니다.',
      drawingPrompts: [
        '주인공을 그려보세요',
        '배경을 그려보세요',
        '중요한 물건을 그려보세요'
      ],
      storyPrompts: [
        '누가 등장하나요?',
        '어떤 일이 일어났나요?',
        '어떻게 끝났나요?'
      ]
    }
  }
}

function parseWHQuestionsResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || '육하원칙 질문',
      story: parsed.story || '이야기를 생성할 수 없습니다.',
      questions: parsed.questions || [
        {
          id: 1,
          question: '누가 등장하나요?',
          answer: '주인공',
          type: 'who',
          difficulty: 1
        }
      ]
    }
  } catch {
    return parseWHQuestions(content)
  }
}
