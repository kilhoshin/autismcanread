import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { renderToBuffer } from '@react-pdf/renderer'
import * as React from 'react'
import WorksheetPDF from '../../../utils/pdf-react-renderer'
import { StoryData } from '@/types/story'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Check if API key is properly configured
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is not set')
} else {
  console.log('✅ GEMINI_API_KEY is configured (length:', process.env.GEMINI_API_KEY.length, ')')
}

// AI prompt generation functions
function generateStoryPrompt(topic: string, readingLevel: number): string {
  return `
Create a reading comprehension story for children with autism spectrum and ADHD in English.

Topic: ${topic}
Reading Level: Grade ${readingLevel}
Target: Children with autism spectrum and ADHD

Requirements:
- Simple and clear language appropriate for Grade ${readingLevel}
- Stories that can capture children's attention (repetitive patterns, clear structure)
- Sensory elements and concrete descriptions
- Positive and encouraging content
- Story length: 150-300 words

Return in JSON format:
{
  "title": "Story title",
  "content": "Story content"
}
`
}

function generateActivityPrompts(storyTitle: string, storyContent: string, activityTypes: string[], readingLevel: string, writingLevel: string): string {
  // 이미 생성된 스토리를 기반으로 활동 생성
  let prompt = `Based on the following story, create educational activities for ${readingLevel} reading level.

STORY CONTENT: "${storyContent}"

IMPORTANT: 
- Use the EXACT characters and events from the story above
- For sentence-order activity, create complete sentences in chronological order
- Do NOT use sequence words like "First", "Then", "Finally", "Second", etc.
- All activities must relate directly to the story content provided

Return ONLY valid JSON format with these exact property names:
{
  "whQuestions": [
    {"question": "Who is the main character?", "answer": "specific answer"},
    {"question": "What happens in the story?", "answer": "specific answer"}
  ],
  "emotionQuiz": [
    {"question": "How does the character feel?", "options": ["happy", "sad", "excited"], "correct": 0}
  ],
  "bmeStory": {"beginning": "story beginning", "middle": "story middle", "end": "story end"},
  "sentenceOrder": [
    {"scrambled": ["Leo found his lightsaber under the leaf.", "Leo went to practice in the field.", "Leo's lightsaber went missing."], "correct": ["Leo went to practice in the field.", "Leo's lightsaber went missing.", "Leo found his lightsaber under the leaf."]}
  ],
  "threeLineSummary": {"lines": ["First thing happened", "Then something else", "Finally it ended"]},
  "sentenceCompletion": [
    {"sentence": "The character was _____ happy.", "answer": "very"}
  ],
  "drawAndTell": {"prompt": "Draw the main character", "questions": ["What did you draw?"]}
}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no extra text.`

  return prompt
}

// Helper function to extract answer from question
function extractAnswerFromQuestion(question: string): string {
  // Simple heuristics to create fallback answers
  if (question.toLowerCase().includes('who')) return 'Leo'
  if (question.toLowerCase().includes('what') && question.toLowerCase().includes('timer')) return 'blue timer'
  if (question.toLowerCase().includes('what') && question.toLowerCase().includes('build')) return 'LEGOs'
  if (question.toLowerCase().includes('where')) return 'home'
  if (question.toLowerCase().includes('why') || question.toLowerCase().includes('how')) return 'homework was hard'
  return 'answer from story'
}

// AI response parsing function
function parseAIResponse(response: string, activityTypes: string[]): Partial<StoryData> {
  try {
    console.log('🔍 PARSE AI RESPONSE DEBUG START')
    console.log('- Response length:', response?.length || 0)
    console.log('- Activity types requested:', activityTypes)
    console.log('Raw AI Response:', response.substring(0, 500) + '...')
    
    // Extract JSON more robustly
    let cleanResponse = response.trim()
    
    // Find the first '{' and last '}' to extract JSON
    const jsonStart = cleanResponse.indexOf('{')
    let jsonEnd = -1
    
    // Find matching closing brace
    if (jsonStart !== -1) {
      let braceCount = 0
      for (let i = jsonStart; i < cleanResponse.length; i++) {
        if (cleanResponse[i] === '{') braceCount++
        if (cleanResponse[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEnd = i
            break
          }
        }
      }
    }
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error('❌ No valid JSON found in response')
      throw new Error(`No valid JSON structure found in AI response: ${cleanResponse.substring(0, 200)}...`)
    }
    
    cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1)
    
    // Fix common JSON issues more aggressively
    cleanResponse = cleanResponse
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to property names
      .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double
      .replace(/\\'/g, "'") // Fix escaped single quotes
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/\r/g, ' ') // Remove carriage returns
      .replace(/\t/g, ' ') // Remove tabs
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/"\s*:\s*"([^"]*?)"\s*,?\s*"([^"]*?)"\s*:/g, '": "$1", "$2":') // Fix concatenated strings
    
    console.log('Cleaned Response:', cleanResponse)
    
    // Final validation - try to parse a minimal version first
    if (!cleanResponse.startsWith('{') || !cleanResponse.endsWith('}')) {
      throw new Error(`Invalid JSON format after cleaning: ${cleanResponse.substring(0, 100)}...`)
    }
    
    console.log('🔍 About to parse JSON...')
    
    let parsed
    try {
      parsed = JSON.parse(cleanResponse)
      console.log('✅ JSON parsing successful!')
    } catch (parseError) {
      console.error('❌ JSON parse failed, trying manual fixes...')
      
      // Try to fix more JSON issues
      let fixedResponse = cleanResponse
        .replace(/([^"])\b(\w+):/g, '$1"$2":')  // Fix unquoted keys more broadly
        .replace(/:\s*([^",\[\]{}]+)(?=\s*[,}])/g, ': "$1"')  // Quote unquoted values
        .replace(/"\s*\+\s*"/g, '')  // Remove string concatenation
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      
      try {
        parsed = JSON.parse(fixedResponse)
        console.log('✅ JSON parsing successful after manual fixes!')
      } catch (finalError) {
        console.error('❌ All JSON parsing attempts failed')
        throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
      }
    }
    
    console.log('Raw parsed JSON keys:', Object.keys(parsed))
    console.log('Raw parsed JSON:', JSON.stringify(parsed, null, 2))
    
    // Convert snake_case to camelCase for activity keys
    if (parsed.wh_questions && !parsed.whQuestions) {
      parsed.whQuestions = parsed.wh_questions
      delete parsed.wh_questions
    }
    if (parsed.emotion_quiz && !parsed.emotionQuiz) {
      parsed.emotionQuiz = parsed.emotion_quiz
      delete parsed.emotion_quiz
    }
    if (parsed.sentence_order && !parsed.sentenceOrder) {
      parsed.sentenceOrder = parsed.sentence_order
      delete parsed.sentence_order
    }
    if (parsed.three_line_summary && !parsed.threeLineSummary) {
      parsed.threeLineSummary = parsed.three_line_summary
      delete parsed.three_line_summary
    }
    if (parsed.sentence_completion && !parsed.sentenceCompletion) {
      parsed.sentenceCompletion = parsed.sentence_completion
      delete parsed.sentence_completion
    }
    if (parsed.draw_and_tell && !parsed.drawAndTell) {
      parsed.drawAndTell = parsed.draw_and_tell
      delete parsed.draw_and_tell
    }
    if (parsed.bme_story && !parsed.bmeStory) {
      parsed.bmeStory = parsed.bme_story
      delete parsed.bme_story
    }
    
    console.log('After snake_case conversion:', parsed)
    
    const result: Partial<StoryData> = {}
    const activityTypeHandlers: { [key: string]: (parsed: any) => void } = {
      whQuestions: (parsed) => {
        console.log('Processing WH Questions...')
        if (parsed.whQuestions && Array.isArray(parsed.whQuestions)) {
          console.log('Original WH Questions:', parsed.whQuestions)
          
          parsed.whQuestions.forEach((q: any, index: number) => {
            console.log(`Question ${index + 1}:`, q)
            if (!q.answer) {
              console.log('Missing answer, generating fallback...')
              q.answer = extractAnswerFromQuestion(q.question || 'Sample question')
              console.log('Added missing answer:', q.answer)
            } else {
              console.log('Answer already exists:', q.answer)
            }
          })
          
          console.log('Final WH Questions:', parsed.whQuestions)
          result.whQuestions = parsed.whQuestions
        } else {
          console.log('No WH Questions found in parsed data')
        }
      },
      emotionQuiz: (parsed) => {
        console.log('Processing Emotion Quiz...')
        if (parsed.emotionQuiz && Array.isArray(parsed.emotionQuiz)) {
          console.log('Original Emotion Quiz:', parsed.emotionQuiz)
          
          parsed.emotionQuiz = parsed.emotionQuiz.map((q: any, index: number) => {
            console.log(`Emotion Question ${index + 1}:`, q)
            
            if (q.correct_answer && !q.correct) {
              console.log('Converting correct_answer to correct index...')
              const correctIndex = q.options?.findIndex((opt: string) => 
                opt.toLowerCase() === q.correct_answer.toLowerCase()
              )
              console.log(`Found correct index: ${correctIndex} for answer: ${q.correct_answer}`)
              return { ...q, correct: correctIndex >= 0 ? correctIndex : 0 }
            } else if (q.correct === undefined || q.correct === null) {
              console.log('No correct index found, defaulting to 0')
              return { ...q, correct: 0 }
            }
            return q
          })
          
          console.log('Final Emotion Quiz:', parsed.emotionQuiz)
          result.emotionQuiz = parsed.emotionQuiz
        } else {
          console.log('No Emotion Quiz found in parsed data')
        }
      },
      bmeStory: (parsed) => {
        result.bmeStory = parsed.bmeStory
      },
      sentenceOrder: (parsed) => {
        console.log('Processing Sentence Order...')
        if (parsed.sentenceOrder) {
          console.log('Original Sentence Order:', parsed.sentenceOrder)
          
          // Handle array format: [{scrambled: [...], correct: [...]}, ...]
          if (Array.isArray(parsed.sentenceOrder)) {
            const firstItem = parsed.sentenceOrder[0]
            if (firstItem && firstItem.scrambled && firstItem.correct) {
              result.sentenceOrder = {
                sentences: firstItem.scrambled, // This should be an array of complete sentences
                correctOrder: firstItem.correct.map((_: string, index: number) => index + 1) // Generate 1-based indices
              }
            }
          }
          // Handle direct object format
          else if (parsed.sentenceOrder.scrambled && parsed.sentenceOrder.correct) {
            result.sentenceOrder = {
              sentences: parsed.sentenceOrder.scrambled, // Array of complete sentences
              correctOrder: parsed.sentenceOrder.correct.map((_: string, index: number) => index + 1) // Generate 1-based indices
            }
          }
          // Handle legacy format with sentences and correctOrder
          else if (parsed.sentenceOrder.sentences) {
            result.sentenceOrder = parsed.sentenceOrder
          }
          
          console.log('Final Sentence Order:', result.sentenceOrder)
        } else {
          console.log('No Sentence Order found in parsed data')
        }
      },
      sentenceCompletion: (parsed) => {
        console.log('Processing Sentence Completion...')
        if (parsed.sentenceCompletion && Array.isArray(parsed.sentenceCompletion)) {
          console.log('Original Sentence Completion:', parsed.sentenceCompletion)
          result.sentenceCompletion = parsed.sentenceCompletion
          console.log('Final Sentence Completion:', result.sentenceCompletion)
        } else {
          console.log('No Sentence Completion found in parsed data')
        }
      },
      threeLineSummary: (parsed) => {
        console.log('Processing Three Line Summary...')
        if (parsed.threeLineSummary) {
          console.log('Original Three Line Summary:', parsed.threeLineSummary)
          
          // Handle array format (convert to string)
          if (Array.isArray(parsed.threeLineSummary)) {
            result.threeLineSummary = {
              line1: parsed.threeLineSummary[0],
              line2: parsed.threeLineSummary[1],
              line3: parsed.threeLineSummary[2]
            }
          } else {
            result.threeLineSummary = parsed.threeLineSummary
          }
          
          console.log('Final Three Line Summary:', result.threeLineSummary)
        } else {
          console.log('No Three Line Summary found in parsed data')
        }
      },
      drawAndTell: (parsed) => {
        console.log('Processing Draw and Tell...')
        if (parsed.drawAndTell) {
          console.log('Original Draw and Tell:', parsed.drawAndTell)
          result.drawAndTell = parsed.drawAndTell
          console.log('Final Draw and Tell:', result.drawAndTell)
        } else {
          console.log('No Draw and Tell found in parsed data')
        }
      },
    }
    
    // Helper function to normalize property names for flexible matching
    const normalizeKey = (key: string): string => {
      return key.toLowerCase().replace(/[-_\s]/g, '')
    }
    
    // Create a mapping of normalized keys to actual keys in parsed data
    const normalizedKeyMap: { [key: string]: string } = {}
    Object.keys(parsed).forEach(key => {
      normalizedKeyMap[normalizeKey(key)] = key
    })
    
    console.log('Normalized key mapping:', normalizedKeyMap)
    console.log('Final parsed result before activity processing:', result)
    
    activityTypes.forEach((type) => {
      // Convert kebab-case to camelCase for handler lookup
      const handlerKey = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      console.log(`🔍 Processing activity type: "${type}" -> handler: "${handlerKey}"`)
      
      // Try to find the data using multiple key variations
      let dataKey = handlerKey
      let data = parsed[dataKey]
      
      if (!data) {
        // Try normalized matching
        const normalizedHandler = normalizeKey(handlerKey)
        dataKey = normalizedKeyMap[normalizedHandler] || handlerKey
        data = parsed[dataKey]
        console.log(`🔍 Trying normalized key: "${normalizedHandler}" -> found key: "${dataKey}"`)
      }
      
      if (activityTypeHandlers[handlerKey]) {
        console.log(`✅ Found handler for: ${handlerKey}, data found: ${!!data}`)
        // Pass the actual data to the handler
        if (data) {
          const tempParsed = { [handlerKey]: data }
          activityTypeHandlers[handlerKey](tempParsed)
        } else {
          activityTypeHandlers[handlerKey](parsed)
        }
      } else {
        console.log(`❌ No handler found for: ${handlerKey}`)
      }
    })
    
    console.log('Final parsed result:', result)
    return result
  } catch (error) {
    console.error('❌ AI response parsing failed:', error)
    console.error('❌ Error type:', error instanceof SyntaxError ? 'JSON Syntax Error' : 'Other Error')
    if (error instanceof SyntaxError) {
      console.error('❌ JSON parsing error details:', {
        message: error.message,
        position: error.message.match(/position (\d+)/)?.[1] || 'unknown'
      })
    }
    
    console.log('📝 Original response length:', response?.length || 0)
    console.log('📝 Response preview:', response?.substring(0, 300) + '...')
    
    console.log('🔄 Using enhanced fallback with story analysis...')
    
    // Try to create better sample data based on story content if available
    const sampleData: Partial<StoryData> = {}
    
    if (activityTypes.includes('wh-questions')) {
      console.log('Creating fallback WH Questions...')
      // Try to extract some info from story for better answers
      const storyLines = arguments[0]?.toLowerCase() || ''
      console.log('Story content for analysis:', storyLines.substring(0, 200) + '...')
      
      let characterName = 'Lily'
      let action = 'ate breakfast'
      let location = 'kitchen'
      let reason = 'was hungry'
      
      // Simple pattern matching for better answers
      if (storyLines.includes('sam') || storyLines.includes('samuel')) characterName = 'Sam'
      if (storyLines.includes('alex')) characterName = 'Alex'
      if (storyLines.includes('emma')) characterName = 'Emma'
      if (storyLines.includes('max')) characterName = 'Max'
      
      if (storyLines.includes('school')) location = 'school'
      if (storyLines.includes('park')) location = 'park'
      if (storyLines.includes('home')) location = 'home'
      if (storyLines.includes('store')) location = 'store'
      
      if (storyLines.includes('played')) action = 'played'
      if (storyLines.includes('went')) action = 'went'
      if (storyLines.includes('found')) action = 'found something'
      if (storyLines.includes('made')) action = 'made something'
      
      sampleData.whQuestions = [
        { question: 'Who is in the story?', answer: characterName },
        { question: `What did ${characterName} do?`, answer: action },
        { question: `Where did ${characterName} go?`, answer: location },
        { question: `Why did this happen?`, answer: reason }
      ]
      
      console.log('Generated fallback WH Questions:', sampleData.whQuestions)
    }
    
    if (activityTypes.includes('emotion-quiz')) {
      sampleData.emotionQuiz = [
        { question: 'How does John feel when he scores a goal?', options: ['Happy', 'Sad', 'Angry'], correct: 0 },
        { question: 'How does John feel when he misses a shot?', options: ['Happy', 'Sad', 'Angry'], correct: 1 },
        { question: 'How does John feel when his friend cheers for him?', options: ['Happy', 'Sad', 'Angry'], correct: 0 }
      ]
    }
    
    if (activityTypes.includes('bme-story')) {
      sampleData.bmeStory = {
        beginning: 'The story starts with...',
        middle: 'In the middle...',
        end: 'At the end...'
      }
    }
    
    if (activityTypes.includes('sentence-order')) {
      sampleData.sentenceOrder = {
        sentences: [
          'The character learned an important lesson.',
          'Something wonderful happened that day.',
          'The character smiled with joy.'
        ],
        correctOrder: [1, 2, 3]
      }
    }
    
    if (activityTypes.includes('three-line-summary')) {
      sampleData.threeLineSummary = {
        line1: 'This is the first line of the summary.',
        line2: 'This is the second line with main events.',
        line3: 'This is the third line with the ending.'
      }
    }
    
    if (activityTypes.includes('sentence-completion')) {
      sampleData.sentenceCompletion = [
        { sentence: 'John went to the _____ to play soccer.', answers: ['park'], blanks: ['_____'] },
        { sentence: 'John felt _____ when he scored a goal.', answers: ['happy'], blanks: ['_____'] },
        { sentence: 'John\'s friends _____ for him when he scored a goal.', answers: ['cheered'], blanks: ['_____'] },
        { sentence: 'John continued to play soccer because he _____ it.', answers: ['loved'], blanks: ['_____'] }
      ]
    }
    
    if (activityTypes.includes('draw-and-tell')) {
      sampleData.drawAndTell = {
        prompt: 'Draw a picture of John playing soccer.',
        questions: [
          'What is John doing in the picture?',
          'What is the ball doing in the picture?',
          'How does John feel in the picture?'
        ]
      }
    }
    
    return sampleData
  }
}

// PDF creation function using React PDF renderer
async function createCombinedPDF(stories: StoryData[], activities: string[]): Promise<Buffer> {
  try {
    console.log('=== PDF Generation Debug ===')
    console.log('Number of stories:', stories.length)
    console.log('Activities array:', activities)
    console.log('Stories data:', JSON.stringify(stories, null, 2))
    
    // Check specific activity data for first story
    if (stories.length > 0) {
      const firstStory = stories[0]
      console.log('First story activities check:')
      console.log('- whQuestions:', firstStory.whQuestions?.length || 0)
      console.log('- emotionQuiz:', firstStory.emotionQuiz?.length || 0)
      console.log('- sentenceOrder:', !!firstStory.sentenceOrder ? 'YES' : 'NO')
      console.log('- bmeStory:', !!firstStory.bmeStory ? 'YES' : 'NO')
      console.log('- sentenceCompletion:', firstStory.sentenceCompletion?.length || 0)
      console.log('- threeLineSummary:', !!firstStory.threeLineSummary ? 'YES' : 'NO')
      console.log('- drawAndTell:', !!firstStory.drawAndTell ? 'YES' : 'NO')
    }
    
    const pdfBuffer = await renderToBuffer(React.createElement(WorksheetPDF, { stories, activities }) as any);
    console.log('PDF buffer size:', pdfBuffer.length)
    console.log('=== End PDF Debug ===')
    
    return pdfBuffer
    
  } catch (error) {
    console.error('❌ React PDF generation failed:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    console.error('Environment:', process.env.NODE_ENV)
    
    // DO NOT use fallback - force React PDF to work!
    throw new Error(`React PDF generation failed: ${error}`)
  }
}

interface WorksheetRequest {
  topics: string[]
  activities: string[]
  count: number
  readingLevel: number
  writingLevel: number
  usePreviewData?: boolean
  previewStoryData?: any
  previewOnly?: boolean  // Add flag for preview-only requests
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const { topics, activities, count, readingLevel, writingLevel, usePreviewData, previewStoryData, previewOnly }: WorksheetRequest = await request.json()

    console.log('🔍 Request parameters:')
    console.log('- usePreviewData:', usePreviewData)
    console.log('- previewStoryData length:', previewStoryData?.length)
    console.log('- previewOnly:', previewOnly)

    if (!topics?.length || !activities?.length || count < 1) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const stories: StoryData[] = []

    if (usePreviewData && previewStoryData) {
      console.log('✅ Using preview data for PDF generation')
      // Use the existing preview data directly
      stories.push(...previewStoryData)
    } else {
      console.log('🔄 Generating new stories from scratch')
      // Generate new stories from scratch
      for (let i = 0; i < count; i++) {
        const topic = topics[Math.floor(Math.random() * topics.length)]
        
        // Generate story with timeout
        const storyPrompt = generateStoryPrompt(topic, readingLevel)
        const storyModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })  // Updated to latest model
        
        // Add timeout wrapper for story generation
        const storyAiPromise = storyModel.generateContent(storyPrompt)
        const storyTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Story generation timeout after 45 seconds')), 45000)
        )
        
        const storyResult = await Promise.race([storyAiPromise, storyTimeoutPromise]) as any
        const storyResponse = storyResult.response.text()
        
        let storyData: any
        try {
          console.log('🧹 Raw story response received:', storyResponse.substring(0, 300) + '...')
          
          // Use the same robust parsing logic as activities
          const parsedStory = parseAIResponse(storyResponse, [])
          
          // Extract story data - parseAIResponse returns an object with story structure
          if (parsedStory && typeof parsedStory === 'object') {
            // If parseAIResponse handled it correctly, extract title and content
            storyData = {
              title: parsedStory.title || `Story about ${topic}`,
              content: parsedStory.content || parsedStory.story || 'Story content not available'
            }
          } else {
            throw new Error('Invalid story structure returned from parsing')
          }
          
          console.log('✅ Story parsing successful:', { title: storyData.title, contentLength: storyData.content?.length })
        } catch (error) {
          console.error('❌ Story generation failed:', error)
          console.error('📄 Raw AI response:', storyResponse.substring(0, 500) + '...')
          return NextResponse.json({ 
            error: 'Story generation failed. Please try again in a moment.',
            details: 'AI service is temporarily unavailable. Your usage count has not been incremented.'
          }, { status: 503 }) // Service Unavailable
        }

        // Generate activities with faster model and timeout
        const activityPrompt = generateActivityPrompts('', storyData.content, activities, String(readingLevel), String(writingLevel))
        console.log('🚀 Activity Prompt sent to AI:')
        console.log('=====================================')
        console.log(activityPrompt)
        console.log('=====================================')
        
        // Use stable and reliable model
        const activityModel = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash',     // Updated to latest stable model
          generationConfig: {
            maxOutputTokens: 2048,       // Increased for complex activities
            temperature: 0.3             // Balanced creativity
          }
        })

        let activityResponse
        try {
          console.log('⏰ Starting AI generation...')
          
          // Verify API connection first
          if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured')
          }
          
          // Add timeout wrapper - reduced for lighter model
          const aiPromise = activityModel.generateContent(activityPrompt)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI generation timeout after 45 seconds')), 45000) // Increased timeout for better reliability
          )
          
          const result = await Promise.race([aiPromise, timeoutPromise]) as any
          
          if (!result || !result.response) {
            throw new Error('Invalid AI response structure')
          }
          
          activityResponse = result.response.text()
          
          if (!activityResponse || activityResponse.trim().length === 0) {
            throw new Error('AI returned empty response')
          }
          
          console.log('✅ AI generation completed successfully!')
          console.log('🔍 RAW AI RESPONSE RECEIVED:')
          console.log('=====================================')
          console.log('Response length:', activityResponse.length)
          console.log('Full response:', activityResponse)
          console.log('=====================================')
          
        } catch (error) {
          console.error('❌ AI generation failed or timed out:', error)
          console.error('Error type:', typeof error)
          console.error('Error message:', error instanceof Error ? error.message : String(error))
          
          // Return proper error response instead of fallback
          if (previewOnly) {
            return Response.json({ 
              error: 'AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
              details: error instanceof Error ? error.message : String(error)
            }, { status: 500 })
          } else {
            return new Response('AI 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.', { 
              status: 500,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
          }
        }

        // Parse AI response
        let parsedActivities: any = {}
        try {
          console.log('🔄 Attempting to parse AI response...')
          
          // First, let's see what JSON we actually got
          console.log('🔍 RAW AI Response for parsing:')
          console.log('===================================')
          console.log(activityResponse)
          console.log('===================================')
          
          // Try to extract and clean JSON
          const cleanResponse = activityResponse.trim().replace(/```json\s*/, '').replace(/```\s*$/, '')
          console.log('🧹 Cleaned response:')
          console.log(cleanResponse)
          
          // Parse JSON
          const rawParsed = JSON.parse(cleanResponse)
          console.log('📋 Raw parsed JSON:')
          console.log(JSON.stringify(rawParsed, null, 2))
          
          parsedActivities = parseAIResponse(cleanResponse, activities)
          console.log('✅ Successfully parsed AI activities:')
          console.log(JSON.stringify(parsedActivities, null, 2))
        } catch (parseError) {
          console.error('❌ Failed to parse AI response, using fallback:', parseError)
          console.error('Parse error details:', parseError instanceof Error ? parseError.message : String(parseError))
          
          // Create simple fallback data
          parsedActivities = {} as any
          
          if (activities.includes('wh-questions')) {
            parsedActivities.whQuestions = [
              { question: 'Who is in the story?', answer: 'The main character' },
              { question: 'What happens in the story?', answer: 'An adventure takes place' },
              { question: 'Where does it happen?', answer: 'In the story setting' },
              { question: 'When does it happen?', answer: 'During the story time' }
            ]
          }
          
          if (activities.includes('sentence-order')) {
            parsedActivities.sentenceOrder = {
              sentences: [
                'Leo went to practice in the field.',
                'Leo\'s lightsaber went missing.',
                'Leo found his lightsaber under the leaf.'
              ],
              correctOrder: [1, 2, 3]
            }
          }
          
          if (activities.includes('emotion-quiz')) {
            parsedActivities.emotionQuiz = [
              { question: 'How does the character feel?', options: ['Happy', 'Sad', 'Excited'], correct: 0 }
            ]
          }
          
          if (activities.includes('bme-story')) {
            parsedActivities.bmeStory = {
              beginning: 'The story starts with...',
              middle: 'In the middle...',
              end: 'At the end...'
            }
          }
          
          if (activities.includes('sentence-completion')) {
            parsedActivities.sentenceCompletion = [
              { sentence: 'The character is _____.', answers: ['happy', 'excited', 'brave'] }
            ]
          }
          
          if (activities.includes('three-line-summary')) {
            parsedActivities.threeLineSummary = {
              line1: 'This is the first line of the summary.',
              line2: 'This is the second line with main events.',
              line3: 'This is the third line with the ending.'
            }
          }
          
          if (activities.includes('draw-and-tell')) {
            parsedActivities.drawAndTell = 'Draw your favorite part of the story and tell someone about it!'
          }
          
          console.log('📋 Using fallback data:', parsedActivities)
        }

        // Merge story data with activities
        const completeStory = { 
          title: storyData.title || `Story about ${topic}`, 
          ...storyData, 
          ...parsedActivities 
        }
        console.log('🔍 Complete story data before adding to array:')
        console.log('- Content length:', completeStory.content?.length || 0)
        console.log('- WH Questions:', completeStory.whQuestions?.length || 0, 'questions')
        console.log('- Emotion Quiz:', completeStory.emotionQuiz?.length || 0, 'questions')
        console.log('- Sentence Order:', !!completeStory.sentenceOrder ? 'YES' : 'NO')
        console.log('- BME Story:', !!completeStory.bmeStory ? 'YES' : 'NO')
        console.log('- Three Line Summary:', !!completeStory.threeLineSummary ? 'YES' : 'NO')
        console.log('- Sentence Completion:', completeStory.sentenceCompletion?.length || 0, 'questions')
        console.log('- Draw and Tell:', !!completeStory.drawAndTell ? 'YES' : 'NO')
        
        stories.push(completeStory)
        
        console.log('Story added to stories array:', stories[stories.length - 1])
      }
    }

    console.log('✅ All stories generated:', stories.length)
    
    // If this is a preview-only request, return JSON data instead of PDF
    if (previewOnly) {
      console.log('📋 Returning preview data only')
      return NextResponse.json({
        stories: stories,
        activities: activities
      })
    }

    // Create combined PDF
    const combinedPdfBuffer = await createCombinedPDF(stories, activities)
    console.log('✅ PDF generation completed, buffer size:', combinedPdfBuffer.length)

    // Return combined PDF
    return new NextResponse(combinedPdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="worksheet-with-answers-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error) {
    console.error('Worksheet generation error:', error)
    return new NextResponse('Failed to generate worksheet', { status: 500 })
  }
}
