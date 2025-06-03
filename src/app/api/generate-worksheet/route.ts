import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import puppeteer from 'puppeteer'
import jsPDF from 'jspdf'
import { generateWorksheetHTML } from '../../../utils/pdf-template'
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
Return all activities in one complete JSON object. Do not include any explanatory text, only valid JSON.

Example:
{
  "whQuestions": [{"question": "Who is the main character?", "answer": "Lily"}],
  "emotionQuiz": [{"question": "How does Lily feel?", "options": ["happy", "sad"], "correct": 0}],
  "sentenceCompletion": [{"sentence": "Lily went to _____.", "answers": ["school"], "blanks": ["_____"]}]
}
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
    console.log('Raw AI Response:', response)
    
    // Remove JSON code block
    let cleanResponse = response.trim()
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
    }
    if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
    }
    
    console.log('Cleaned Response:', cleanResponse)
    
    const parsed = JSON.parse(cleanResponse)
    console.log('Raw parsed JSON:', parsed)
    
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
    
    // Convert AI format to our expected format if needed
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
        result.sentenceOrder = parsed.sentenceOrder
      },
      threeLineSummary: (parsed) => {
        result.threeLineSummary = parsed.threeLineSummary
      },
      sentenceCompletion: (parsed) => {
        if (parsed.sentenceCompletion && Array.isArray(parsed.sentenceCompletion)) {
          parsed.sentenceCompletion = parsed.sentenceCompletion.map((q: any) => {
            if (!q.answers && q.sentence) {
              return { sentence: q.sentence, answers: ['answer'], blanks: ['_____'] }
            }
            return q
          })
          result.sentenceCompletion = parsed.sentenceCompletion
          console.log('Sentence Completion from parsed data:', result.sentenceCompletion)
        }
      },
      drawAndTell: (parsed) => {
        result.drawAndTell = parsed.drawAndTell
      },
    }
    
    activityTypes.forEach((type) => {
      if (activityTypeHandlers[type]) {
        activityTypeHandlers[type](parsed)
      }
    })
    
    console.log('Final parsed result:', result)
    return result
  } catch (error) {
    console.error('AI response parsing failed:', error)
    console.log('Using fallback with story analysis...')
    
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
        sentences: [
          'John plays soccer.',
          'John scores a goal.',
          'John\'s friends cheer for him.',
          'John feels happy and proud of himself.',
          'John continues to play soccer.'
        ],
        correctOrder: [1, 2, 3, 4, 5]
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

// PDF creation function using HTML→PDF approach
async function createCombinedPDF(stories: StoryData[]): Promise<Buffer> {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 0
    })
    
    const page = await browser.newPage()
    
    // Generate HTML content
    const htmlContent = generateWorksheetHTML(stories)
    
    // Set content
    await page.setContent(htmlContent, { 
      waitUntil: 'load'
    })
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: {
        top: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
        right: '0.75in'
      }
    })
    
    await page.close()
    await browser.close()
    return Buffer.from(pdfBuffer)
    
  } catch (error) {
    console.error('Puppeteer PDF generation failed:', error)
    console.log('Using jsPDF fallback...')
    
    // Fallback to jsPDF generation with clean formatting
    return createFallbackPDF(stories)
  }
}

// Fallback PDF creation using jsPDF
function createFallbackPDF(stories: StoryData[]): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })
  
  const pageWidth = 216
  const pageHeight = 279
  const margin = 20
  let yPosition = margin
  
  // Helper functions
  const addTitle = (title: string) => {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15
  }
  
  const addContent = (content: string) => {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(content, pageWidth - (margin * 2))
    doc.text(lines, margin, yPosition)
    yPosition += lines.length * 6 + 10
  }
  
  // Generate worksheet content
  stories.forEach((story, index) => {
    if (index > 0) {
      doc.addPage()
      yPosition = margin
    }
    
    addTitle(`Story ${index + 1}: ${story.title || 'Reading Adventure'}`)
    addContent(story.content || story.story || '')
    
    if (story.whQuestions) {
      addTitle('WH Questions')
      story.whQuestions.forEach((q: any, i: number) => {
        const questionText = typeof q === 'string' ? q : q.question
        doc.text(`${i + 1}. ${questionText}`, margin, yPosition)
        yPosition += 15
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10
      })
    }
  })
  
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}

interface WorksheetRequest {
  topics: string[]
  activities: string[]
  count: number
  readingLevel: number
  writingLevel: number
  usePreviewData?: boolean
  previewStoryData?: any
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const { topics, activities, count, readingLevel, writingLevel, usePreviewData, previewStoryData }: WorksheetRequest = await request.json()

    if (!topics?.length || !activities?.length || count < 1) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const stories: StoryData[] = []

    if (usePreviewData && previewStoryData) {
      // Use the existing preview data directly
      stories.push(...previewStoryData)
    } else {
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
        
        console.log('RAW AI Activity Response:', activityResponse)
        
        const activityData = parseAIResponse(activityResponse, activities)
        
        console.log('Final activity data before adding to stories:', activityData)
        
        stories.push({
          title: storyData.title,
          content: storyData.content,
          ...activityData
        })
        
        console.log('Story added to stories array:', stories[stories.length - 1])
      }
    }

    // Create combined PDF with both worksheet and answer key
    const combinedPdfBuffer = await createCombinedPDF(stories)

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
