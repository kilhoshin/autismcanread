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
Create a story that is suitable for a ${readingLevel}th-grade reading level and a ${writingLevel}th-grade writing level.
- Use simple and clear sentences
- Use vocabulary that is suitable for the grade level
- Use concrete and clear expressions that are easy for children with autism/ADHD to understand
- Topic: ${topic}
`

  switch (activityType) {
    case 'bme-story':
      return `${baseInstructions}

Create a story with a clear beginning, middle, and end structure.
Make sure the story has a clear start, middle, and end.

Response format:
STORY:
[Entire story]

BEGINNING:
[Beginning part]

MIDDLE:
[Middle part]

END:
[End part]`

    case 'wh-questions':
      return `${baseInstructions}

Create a story that includes information to answer WH questions (WHO, WHAT, WHEN, WHERE, WHY, HOW).
Create a story that answers the following questions:

WHO: [WHO question]
WHAT: [WHAT question]
WHEN: [WHEN question]  
WHERE: [WHERE question]
WHY: [WHY question]

HINTS:
WHO: [WHO question hint]
WHAT: [WHAT question hint]
WHEN: [WHEN question hint]
WHERE: [WHERE question hint]
WHY: [WHY question hint]

Response format:
STORY:
[Entire story]

QUESTIONS:
WHO: [WHO question]
WHAT: [WHAT question]
WHEN: [WHEN question]  
WHERE: [WHERE question]
WHY: [WHY question]

HINTS:
WHO: [WHO question hint]
WHAT: [WHAT question hint]
WHEN: [WHEN question hint]
WHERE: [WHERE question hint]
WHY: [WHY question hint]`

    case 'emotion-quiz':
      return `${baseInstructions}

Create a story that includes a character's emotional changes.
Include emotions such as happiness, sadness, anger, surprise, fear, and love.

Response format:
STORY:
[Entire story]

QUESTIONS:
1. [First scenario]: [Scenario description]
ANSWER: [Correct emotion]
EXPLANATION: [Explanation]

2. [Second scenario]: [Scenario description]
ANSWER: [Correct emotion]
EXPLANATION: [Explanation]

3. [Third scenario]: [Scenario description]
ANSWER: [Correct emotion]
EXPLANATION: [Explanation]`

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
Create a story for a reading comprehension activity for children with autism/ADHD.

Requirements:
- Reading level: ${readingLevel}th grade (1-5th grade, higher is more difficult)
- Writing level: ${writingLevel}th grade
- Topic: ${topic}
- Story length: 8-12 sentences
- Clear structure (beginning-middle-end)

Response format:
{
  "title": "Story title",
  "story": "Entire story content",
  "summaryGuide": [
    "First line summary guide",
    "Second line summary guide", 
    "Third line summary guide"
  ]
}

Create a story that is easy for children to understand and has a clear beginning-middle-end structure.
The summary guide is a brief summary of each part.

`
}

function generateSentenceCompletionPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  return `
Create a story for a sentence completion activity for children with autism/ADHD.

Requirements:
- Reading level: ${readingLevel}th grade (1-5th grade, higher is more difficult)
- Writing level: ${writingLevel}th grade
- Topic: ${topic}
- Story length: 6-8 sentences
- 5 blank questions

Response format:
{
  "title": "Story title",
  "story": "Complete story without blanks",
  "blanks": [
    {
      "id": 1,
      "original": "Original sentence",
      "withBlank": "Sentence with blank",
      "answer": "Correct answer"
    }
  ]
}

Choose words that are important in the context and suitable for the child's level.
Use ______ to indicate the blank.

`
}

function generateDrawAndTellPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  return `
Create a guide for a drawing and storytelling activity for children with autism/ADHD.

Requirements:
- Reading level: ${readingLevel}th grade (1-5th grade, higher is more difficult)
- Writing level: ${writingLevel}th grade
- Topic: ${topic}
- Content suitable for drawing and storytelling

Response format:
{
  "title": "Activity title",
  "story": "Topic description and drawing guide",
  "drawingPrompts": [
    "Element to draw 1",
    "Element to draw 2",
    "Element to draw 3"
  ],
  "storyPrompts": [
    "Content to include in the story 1",
    "Content to include in the story 2",
    "Content to include in the story 3"
  ]
}

Provide a guide that allows children to express their creativity freely.

`
}

function generateSentenceOrderPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  return `
Create a story for a sentence order activity for children with autism/ADHD.

Requirements:
- Reading level: ${readingLevel}th grade (1-5th grade, higher is more difficult)
- Writing level: ${writingLevel}th grade
- Topic: ${topic}
- Story length: 5-7 sentences
- Clear sequence of events

Response format:
{
  "title": "Story title",
  "story": "Entire story content",
  "sentences": [
    {
      "id": 1,
      "text": "Sentence content",
      "correctOrder": 1
    }
  ]
}

Create a story with a clear sequence of events.

`
}

function generateWHQuestionsPrompt(readingLevel: number, writingLevel: number, topic: string): string {
  const baseInstructions = `Create a story that meets the following conditions:
- Reading comprehension activity for children with autism/ADHD
- Reading level: ${readingLevel}th grade (1-5th grade, higher is more difficult)
- Writing level: ${writingLevel}th grade
- Topic: ${topic}
- Story length: 8-12 sentences`

  return `${baseInstructions}

Response format:
{
  "title": "Story title",
  "story": "Entire story content",
  "questions": [
    {
      "id": 1,
      "question": "When did it happen?",
      "answer": "Correct answer",
      "type": "when",
      "difficulty": 1
    }
  ]
}

Create a story that includes WH questions (WHO, WHAT, WHEN, WHERE, WHY, HOW) and answers.

`
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
        hint: hintMatch?.[1]?.trim() || `${type.toLowerCase()} related content`
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
      title: parsed.title || 'Sentence Order',
      story: parsed.story || 'Unable to generate story.',
      sentences: parsed.sentences || [
        {
          id: 1,
          text: 'First sentence.',
          correctOrder: 1
        }
      ]
    }
  } catch {
    return {
      title: 'Sentence Order',
      story: 'Error parsing story. Providing sample story.',
      sentences: [
        {
          id: 1,
          text: 'First sentence.',
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
      title: parsed.title || 'Three-Line Summary',
      story: parsed.story || 'Unable to generate story.',
      summaryGuide: parsed.summaryGuide || [
        'First line summary',
        'Second line summary',
        'Third line summary'
      ]
    }
  } catch {
    return {
      title: 'Three-Line Summary',
      story: 'Error parsing story. Providing sample story.',
      summaryGuide: [
        'First line summary',
        'Second line summary',
        'Third line summary'
      ]
    }
  }
}

function parseSentenceCompletionResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || 'Sentence Completion',
      story: parsed.story || 'Unable to generate story.',
      blanks: parsed.blanks || [
        {
          id: 1,
          original: 'Sample sentence.',
          withBlank: 'Sample ______.',
          answer: 'sentence'
        }
      ]
    }
  } catch {
    return {
      title: 'Sentence Completion',
      story: 'Error parsing story. Providing sample story.',
      blanks: [
        {
          id: 1,
          original: 'Sample sentence.',
          withBlank: 'Sample ______.',
          answer: 'sentence'
        }
      ]
    }
  }
}

function parseDrawAndTellResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || 'Draw and Tell',
      story: parsed.story || 'Draw and tell a story.',
      drawingPrompts: parsed.drawingPrompts || [
        'Draw the main character',
        'Draw the background',
        'Draw an important object'
      ],
      storyPrompts: parsed.storyPrompts || [
        'Who is in the story?',
        'What happened?',
        'How did it end?'
      ]
    }
  } catch {
    return {
      title: 'Draw and Tell',
      story: 'Error parsing story. Providing sample guide.',
      drawingPrompts: [
        'Draw the main character',
        'Draw the background',
        'Draw an important object'
      ],
      storyPrompts: [
        'Who is in the story?',
        'What happened?',
        'How did it end?'
      ]
    }
  }
}

function parseWHQuestionsResponse(content: string) {
  try {
    const parsed = JSON.parse(content)
    return {
      title: parsed.title || 'WH Questions',
      story: parsed.story || 'Unable to generate story.',
      questions: parsed.questions || [
        {
          id: 1,
          question: 'Who is in the story?',
          answer: 'Main character',
          type: 'who',
          difficulty: 1
        }
      ]
    }
  } catch {
    return parseWHQuestions(content)
  }
}
