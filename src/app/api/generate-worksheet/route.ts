import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { renderToBuffer } from '@react-pdf/renderer'
import * as React from 'react'
import WorksheetPDF from '../../../utils/pdf-react-renderer'
import { StoryData } from '@/types/story'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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

function generateActivityPrompts(storyContent: string, activityTypes: string[]): string {
  let prompt = `
Based on the following story, create activities suitable for children with autism spectrum and ADHD.

Story:
${storyContent}

IMPORTANT: Read the story above carefully and use ONLY information from this specific story for all answers.

Create the following activities: ${activityTypes.join(', ')}

Requirements:
- Clear and simple questions
- Avoid abstract concepts, use concrete examples
- Step-by-step structured approach
- Visual and repetitive elements
- Appropriate difficulty for special education

`

  if (activityTypes.includes('whQuestions')) {
    prompt += `
CRITICAL: For WH Questions, you MUST analyze the story above and extract REAL details.

Step 1: Read the story and identify:
- Character names (not "the character" but actual names like "Lily", "Sam", etc.)
- Specific actions (not "did something" but "ate breakfast", "played soccer", etc.)
- Exact locations (not "somewhere" but "kitchen", "park", "school", etc.)
- Clear reasons or times (not "because" but "to find her friend", "in the morning", etc.)

Step 2: Create exactly 4 questions using these REAL details:

MANDATORY FORMAT - DO NOT CHANGE:
{ "whQuestions": [
  {"question": "Who [specific action]?", "answer": "[character name from story]"},
  {"question": "What did [character name] [action]?", "answer": "[specific object/action from story]"},
  {"question": "Where did [character name] [action]?", "answer": "[specific place from story]"},
  {"question": "Why/When [event from story]?", "answer": "[specific reason/time from story]"}
]}

REQUIRED: Each object MUST have both "question" AND "answer" fields.

EXAMPLE (copy this structure exactly):
{"question": "Who went to school?", "answer": "Leo"}
{"question": "What did Leo use?", "answer": "blue timer"}
{"question": "Where did Leo do homework?", "answer": "home"}
{"question": "Why was Leo worried?", "answer": "homework was hard"}
`
  }

  if (activityTypes.includes('emotionQuiz')) {
    prompt += `
For Emotion Quiz: Create 2-3 multiple choice questions about characters' feelings with CLEAR CORRECT ANSWERS.

MANDATORY FORMAT - DO NOT CHANGE:
{ "emotionQuiz": [
  {"question": "How does [character] feel when [specific event]?", "options": ["happy", "sad", "angry", "excited"], "correct": 0}
]}

REQUIRED: Each object MUST have "question", "options" array, and "correct" number (0-3).
The "correct" field MUST be the INDEX number of the correct option (0, 1, 2, or 3).

EXAMPLE (copy this structure exactly):
{"question": "How does Leo feel about homework at first?", "options": ["happy", "worried", "angry", "excited"], "correct": 1}
{"question": "How does Leo feel after using the timer?", "options": ["worried", "calm", "angry", "sad"], "correct": 1}
`
  }

  if (activityTypes.includes('bmeStory')) {
    prompt += `
For BME Story: Provide framework for Beginning-Middle-End story structure.
Format: { "bmeStory": { "beginning": "example beginning", "middle": "example middle", "end": "example end" } }
`
  }

  if (activityTypes.includes('sentenceOrder')) {
    prompt += `
For Sentence Order: Create 4-6 sentences from the story that can be reordered.
Format: { "sentenceOrder": { "sentences": ["First sentence", "Second sentence", ...], "correctOrder": [1, 2, 3, ...] } }
`
  }

  if (activityTypes.includes('threeLineSummary')) {
    prompt += `
For Three Line Summary: Provide structure for summarizing in 3 lines.
Format: { "threeLineSummary": { "line1": "first summary line", "line2": "second summary line", "line3": "third summary line" } }
`
  }

  if (activityTypes.includes('sentenceCompletion')) {
    prompt += `
For Sentence Completion: Create 3-4 incomplete sentences from the story with SPECIFIC ANSWERS from the story content.

MANDATORY FORMAT - DO NOT CHANGE:
{ "sentenceCompletion": [
  {"sentence": "The character went to _____ to find her friend.", "answers": ["park"], "blanks": ["_____"]},
  {"sentence": "She felt _____ when she saw the rainbow.", "answers": ["happy"], "blanks": ["_____"]}
]}

REQUIRED: Each object MUST have both "sentence", "answers" AND "blanks" fields.
The "sentence" must contain _____ where the blank word goes.
The "answers" must be the word that fills the blank.
The "blanks" must be the blank word in the sentence.

EXAMPLE (copy this structure exactly):
{"sentence": "Leo used the _____ to help with homework.", "answers": ["timer"], "blanks": ["_____"]}
{"sentence": "Leo felt _____ at the beginning.", "answers": ["worried"], "blanks": ["_____"]}
{"sentence": "Leo built _____ during his break.", "answers": ["LEGOs"], "blanks": ["_____"]}
`
  }

  if (activityTypes.includes('drawAndTell')) {
    prompt += `
For Draw and Tell: Create drawing prompt and related questions.
Format: { "drawAndTell": { "prompt": "Draw your favorite scene from the story", "questions": ["What did you draw?", "Why is this your favorite part?"] } }
`
  }

  prompt += `
CRITICAL JSON FORMAT RULES:
1. Use EXACT property names: "whQuestions", "emotionQuiz", "bmeStory", "sentenceOrder", "threeLineSummary", "sentenceCompletion", "drawAndTell"
2. NO underscores in property names (wh_questions ❌, whQuestions ✅)
3. NO extra text or IDs in the JSON
4. ALL strings must be properly escaped and quoted
5. NO trailing commas

EXAMPLE VALID JSON:
{
  "whQuestions": [
    {"question": "Who is the main character?", "answer": "Maya"}
  ],
  "emotionQuiz": [
    {"question": "How does Maya feel?", "options": ["happy", "sad"], "correct": 0}
  ]
}

Return ONLY valid JSON with no extra text before or after.
`
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
    console.log('- Raw AI Response preview:', response?.substring(0, 500) + '...')
    
    let cleanResponse = response.trim()
    
    // Check if response is actually an error message
    if (cleanResponse.startsWith('Failed') || cleanResponse.startsWith('Error') || cleanResponse.startsWith('Sorry')) {
      console.error('❌ AI returned error message instead of JSON:', cleanResponse)
      throw new Error(`AI generation failed: ${cleanResponse}`)
    }
    
    // Remove markdown code blocks
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
    }
    
    // Remove any extra text before/after JSON
    const jsonStart = cleanResponse.indexOf('{')
    const jsonEnd = cleanResponse.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.error('❌ No valid JSON found in response')
      throw new Error(`No valid JSON structure found in AI response: ${cleanResponse.substring(0, 200)}...`)
    }
    
    cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1)
    
    // Fix common JSON issues
    cleanResponse = cleanResponse
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to property names
      .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double
      .replace(/\\'/g, "'") // Fix escaped single quotes
      .replace(/\n/g, ' ') // Remove newlines
      .replace(/\s+/g, ' ') // Normalize spaces
    
    console.log('Cleaned Response:', cleanResponse)
    
    // Validate JSON before parsing
    if (!cleanResponse.startsWith('{') || !cleanResponse.endsWith('}')) {
      throw new Error(`Invalid JSON format: ${cleanResponse.substring(0, 100)}...`)
    }
    
    console.log('🔍 About to parse JSON...')
    const parsed = JSON.parse(cleanResponse)
    console.log('✅ JSON parsing successful!')
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
            const sentences = parsed.sentenceOrder.map((item: any) => 
              Array.isArray(item.scrambled) ? item.scrambled.join(' ') : item.scrambled
            )
            const correctOrder = parsed.sentenceOrder.map((item: any, index: number) => index + 1)
            
            result.sentenceOrder = {
              sentences: sentences,
              correctOrder: correctOrder
            }
          }
          // Handle object format with correctOrder and sentences
          else if (parsed.sentenceOrder.correctOrder && Array.isArray(parsed.sentenceOrder.correctOrder)) {
            // If correctOrder contains actual sentences (not indices)
            if (typeof parsed.sentenceOrder.correctOrder[0] === 'string') {
              result.sentenceOrder = {
                sentences: parsed.sentenceOrder.correctOrder,
                correctOrder: parsed.sentenceOrder.correctOrder.map((_: any, index: number) => index + 1)
              }
            } else {
              // If correctOrder contains indices, use jumbled sentences
              result.sentenceOrder = {
                sentences: parsed.sentenceOrder.jumbled || parsed.sentenceOrder.sentences || [],
                correctOrder: parsed.sentenceOrder.correctOrder
              }
            }
          } else if (parsed.sentenceOrder.sentences) {
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
            result.threeLineSummary = parsed.threeLineSummary.join(' ')
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
    
    // Map activity request names to handler names
    const activityNameMap: { [key: string]: string } = {
      'wh-questions': 'whQuestions',
      'emotion-quiz': 'emotionQuiz', 
      'sentence-order': 'sentenceOrder',
      'sentence-completion': 'sentenceCompletion',
      'three-line-summary': 'threeLineSummary',
      'bme-story': 'bmeStory',
      'draw-and-tell': 'drawAndTell'
    }
    
    console.log('Final parsed result before activity processing:', result)
    
    activityTypes.forEach((type) => {
      const handlerKey = activityNameMap[type] || type
      console.log(`🔍 Processing activity type: "${type}" -> handler: "${handlerKey}"`)
      
      if (activityTypeHandlers[handlerKey]) {
        console.log(`✅ Found handler for: ${handlerKey}`)
        activityTypeHandlers[handlerKey](parsed)
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
    
    if (activityTypes.includes('whQuestions')) {
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
    
    if (activityTypes.includes('emotionQuiz')) {
      sampleData.emotionQuiz = [
        { question: 'How does John feel when he scores a goal?', options: ['Happy', 'Sad', 'Angry'], correct: 0 },
        { question: 'How does John feel when he misses a shot?', options: ['Happy', 'Sad', 'Angry'], correct: 1 },
        { question: 'How does John feel when his friend cheers for him?', options: ['Happy', 'Sad', 'Angry'], correct: 0 }
      ]
    }
    
    if (activityTypes.includes('bmeStory')) {
      sampleData.bmeStory = {
        beginning: 'The story begins with John playing soccer.',
        middle: 'John scores a goal and his friends cheer for him.',
        end: 'John feels happy and proud of himself.'
      }
    }
    
    if (activityTypes.includes('sentenceOrder')) {
      sampleData.sentenceOrder = {
        sentences: ['First, something happens.', 'Then, something else occurs.', 'Finally, the story ends.'],
        correctOrder: [1, 2, 3]
      }
    }
    
    if (activityTypes.includes('threeLineSummary')) {
      sampleData.threeLineSummary = {
        line1: 'John plays soccer and scores a goal.',
        line2: 'His friends cheer for him and he feels happy.',
        line3: 'John continues to play soccer and feels proud of himself.'
      }
    }
    
    if (activityTypes.includes('sentenceCompletion')) {
      sampleData.sentenceCompletion = [
        { sentence: 'John went to the _____ to play soccer.', answers: ['park'], blanks: ['_____'] },
        { sentence: 'John felt _____ when he scored a goal.', answers: ['happy'], blanks: ['_____'] },
        { sentence: 'John\'s friends _____ for him when he scored a goal.', answers: ['cheered'], blanks: ['_____'] },
        { sentence: 'John continued to play soccer because he _____ it.', answers: ['loved'], blanks: ['_____'] }
      ]
    }
    
    if (activityTypes.includes('drawAndTell')) {
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
        
        // Generate story
        const storyPrompt = generateStoryPrompt(topic, readingLevel)
        const storyModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })
        const storyResult = await storyModel.generateContent(storyPrompt)
        const storyResponse = storyResult.response.text()
        
        let storyData: any
        try {
          const cleanStoryResponse = storyResponse.trim().replace(/```json\s*/, '').replace(/```\s*$/, '')
          storyData = JSON.parse(cleanStoryResponse)
        } catch (error) {
          storyData = { title: 'Sample Story', content: 'This is a sample story about ' + topic }
        }

        // Generate activities
        const activityPrompt = generateActivityPrompts(storyData.content, activities)
        console.log('Activity Prompt sent to AI:', activityPrompt)
        
        const activityModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' })
        const activityResult = await activityModel.generateContent(activityPrompt)
        const activityResponse = activityResult.response.text()
        
        console.log('RAW AI Activity Response:')
        console.log('=====================================')
        console.log(activityResponse)
        console.log('=====================================')
        console.log('Response length:', activityResponse?.length || 0)
        console.log('Response type:', typeof activityResponse)
        
        // Parse AI response
        let parsedActivities
        try {
          console.log('🔄 Attempting to parse AI response...')
          parsedActivities = parseAIResponse(activityResponse, activities)
          console.log('✅ Successfully parsed AI activities:')
          console.log(JSON.stringify(parsedActivities, null, 2))
        } catch (parseError) {
          console.error('❌ Failed to parse AI response, using fallback:', parseError)
          console.error('Parse error details:', parseError instanceof Error ? parseError.message : String(parseError))
          
          // Create simple fallback data
          parsedActivities = {} as any
          
          if (activities.includes('whQuestions')) {
            parsedActivities.whQuestions = [
              { question: 'Who is in the story?', answer: 'The main character' },
              { question: 'What happens in the story?', answer: 'An adventure takes place' },
              { question: 'Where does it happen?', answer: 'In the story setting' },
              { question: 'When does it happen?', answer: 'During the story time' }
            ]
          }
          
          if (activities.includes('sentenceOrder')) {
            parsedActivities.sentenceOrder = {
              sentences: ['First, something happens.', 'Then, something else occurs.', 'Finally, the story ends.'],
              correctOrder: [1, 2, 3]
            }
          }
          
          if (activities.includes('emotionQuiz')) {
            parsedActivities.emotionQuiz = [
              { question: 'How does the character feel?', options: ['Happy', 'Sad', 'Excited'], correct: 0 }
            ]
          }
          
          if (activities.includes('bmeStory')) {
            parsedActivities.bmeStory = {
              beginning: 'The story starts with...',
              middle: 'In the middle...',
              end: 'At the end...'
            }
          }
          
          if (activities.includes('sentenceCompletion')) {
            parsedActivities.sentenceCompletion = [
              { sentence: 'The character is _____.', answers: ['happy', 'excited', 'brave'] }
            ]
          }
          
          if (activities.includes('threeLineSummary')) {
            parsedActivities.threeLineSummary = 'This is a three line summary of the story. It includes the main events. The story has a good ending.'
          }
          
          if (activities.includes('drawAndTell')) {
            parsedActivities.drawAndTell = 'Draw your favorite part of the story and tell someone about it!'
          }
          
          console.log('📋 Using fallback data:', parsedActivities)
        }

        // Merge story data with activities
        const completeStory = { ...storyData, ...parsedActivities }
        console.log('🔍 Complete story data before adding to array:')
        console.log('- Title:', completeStory.title)
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
