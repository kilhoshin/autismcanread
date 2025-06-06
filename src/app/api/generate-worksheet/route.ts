import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { renderToBuffer } from '@react-pdf/renderer'
import * as React from 'react'
import WorksheetPDF from '../../../utils/pdf-react-renderer'
import { StoryData } from '@/types/story'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface WorksheetRequest {
  topics: string[]
  activities: string[]
  count: number
  readingLevel: number
  writingLevel: number
  customTopic?: string
  previewOnly?: boolean
  userId?: string
  usePreviewData?: boolean
  previewStoryData?: StoryData[]
}

export async function POST(request: NextRequest) {
  try {
    const body: WorksheetRequest = await request.json()
    console.log('🚀 Simple workflow started:', body)

    // Check user subscription and usage limits
    if (body.userId) {
      const { data: user, error } = await supabase
        .from('users')
        .select('subscription_status, monthly_worksheets_generated')
        .eq('id', body.userId)
        .single()

      if (error) {
        console.error('❌ Error fetching user:', error)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      console.log('📊 User status:', user.subscription_status, 'Generated:', user.monthly_worksheets_generated)

      // Check subscription status and limitations
      if (user.subscription_status === 'free' || !user.subscription_status) {
        // Free Plan users: Only previews allowed, NO PDF downloads
        if (!body.previewOnly) {
          return NextResponse.json({ 
            error: 'PDF downloads require Premium',
            message: 'Free Plan allows worksheet previews only. Upgrade to Premium for PDF downloads.',
            upgrade_required: true
          }, { status: 403 })
        }

        // Check preview usage limits for Free Plan users
        const currentUsage = user.monthly_worksheets_generated || 0
        const totalSheetsRequested = body.count
        
        if (currentUsage >= 5) {
          return NextResponse.json({ 
            error: 'Preview limit exceeded',
            message: `Free Plan allows 5 worksheet previews per month. You have used ${currentUsage}/5 previews.`,
            upgrade_required: true
          }, { status: 403 })
        }
        
        if (currentUsage + totalSheetsRequested > 5) {
          return NextResponse.json({ 
            error: 'Preview limit would be exceeded',
            message: `Free Plan allows 5 worksheet previews per month. You have ${currentUsage}/5 used. Requesting ${totalSheetsRequested} more would exceed the limit.`,
            upgrade_required: true
          }, { status: 403 })
        }
      }
    }

    let stories: StoryData[] = []

    if (body.usePreviewData && body.previewStoryData) {
      console.log('📋 Using preview story data')
      stories = body.previewStoryData
    } else {
      // Generate multiple stories based on count
      const finalTopic = body.customTopic || body.topics.join(', ')
      
      console.log(`📝 Generating ${body.count} worksheets...`)
      
      for (let i = 0; i < body.count; i++) {
        console.log(`📖 Creating story ${i + 1}/${body.count}...`)
        
        // Create unique prompt for each story to ensure variety
        const prompt = createComprehensivePrompt(finalTopic, body.readingLevel, body.writingLevel, i + 1)
        
        // Single Gemini API call per story
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()
        
        console.log(`✅ Story ${i + 1} response received, length:`, text.length)
        
        // Parse the comprehensive response
        const storyData: StoryData = parseComprehensiveResponse(text)
        console.log(`✅ Story ${i + 1} parsed:`, {
          title: storyData.title,
          contentLength: storyData.content?.length,
          activitiesFound: Object.keys(storyData).filter(key => key !== 'title' && key !== 'content')
        })
        
        // Filter activities based on user selection
        const filteredStory: StoryData = filterSelectedActivities(storyData, body.activities)
        stories.push(filteredStory)
      }
    }
    
    if (body.previewOnly) {
      console.log('📋 Returning preview data for', stories.length, 'stories')
      
      // Update usage counter for Free Plan users on preview generation
      if (body.userId) {
        try {
          const { data: user } = await supabase
            .from('users')
            .select('subscription_status, monthly_worksheets_generated')
            .eq('id', body.userId)
            .single()

          // Only count usage for Free Plan users
          if (user && (user.subscription_status === 'free' || !user.subscription_status)) {
            const newUsage = (user.monthly_worksheets_generated || 0) + body.count
            
            await supabase
              .from('users')
              .update({ monthly_worksheets_generated: newUsage })
              .eq('id', body.userId)
              
            console.log('📊 Updated preview usage count for Free Plan user:', newUsage)
          }
        } catch (updateError) {
          console.error('❌ Error updating usage count:', updateError)
          // Don't fail the request if usage update fails
        }
      }
      
      return NextResponse.json({
        stories: stories,
        success: true
      })
    }
    
    // Generate PDF with all stories (Premium users only reach here)
    console.log('📄 Generating PDF with', stories.length, 'stories...')
    const pdfBuffer = await generateWorksheetPDF(stories, body.activities)
    
    // No usage tracking needed for PDF downloads (Premium users have unlimited)
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="worksheet-${stories.length}-stories-${Date.now()}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json({
      error: 'Failed to generate worksheet',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function createComprehensivePrompt(topic: string, readingLevel: number, writingLevel: number, storyNumber: number): string {
  // Add variety elements for different stories
  const varietyElements = [
    {
      characters: ['Emma', 'Leo', 'Maya', 'Sam', 'Alex'],
      settings: ['in the morning', 'on a sunny afternoon', 'during the weekend', 'after school'],
      moods: ['excited', 'curious', 'determined', 'cheerful']
    },
    {
      characters: ['Zoe', 'Ben', 'Luna', 'River', 'Sky'],
      settings: ['at the park', 'in the garden', 'at home', 'in the neighborhood'],
      moods: ['happy', 'focused', 'creative', 'thoughtful']
    },
    {
      characters: ['Sage', 'Robin', 'Phoenix', 'Ocean', 'Star'],
      settings: ['in the kitchen', 'in the backyard', 'at the library', 'in the living room'],
      moods: ['patient', 'enthusiastic', 'gentle', 'proud']
    }
  ]
  
  const variety = varietyElements[(storyNumber - 1) % varietyElements.length]
  const suggestedCharacter = variety.characters[Math.floor(Math.random() * variety.characters.length)]
  const suggestedSetting = variety.settings[Math.floor(Math.random() * variety.settings.length)]
  const suggestedMood = variety.moods[Math.floor(Math.random() * variety.moods.length)]

  return `Create a complete reading comprehension worksheet for children with autism spectrum and ADHD.

TOPIC: ${topic}
READING LEVEL: Grade ${readingLevel}
WRITING LEVEL: Grade ${writingLevel}
STORY NUMBER: ${storyNumber}

Create a UNIQUE story (150-300 words) with simple, clear language and positive content.
Use different characters and scenarios for variety.

SUGGESTIONS for Story ${storyNumber}:
- Main character could be: ${suggestedCharacter}
- Setting could be: ${suggestedSetting} 
- Character could feel: ${suggestedMood}

Then create ALL 7 activity types based on the EXACT story content.

Return ONLY valid JSON in this exact format:
{
  "title": "Story title",
  "content": "Complete story content here",
  "whQuestions": [
    {"question": "Who is the main character?", "answer": "exact answer from story"},
    {"question": "What happens in the story?", "answer": "exact answer from story"},
    {"question": "When does this happen?", "answer": "exact answer from story"},
    {"question": "Where does this take place?", "answer": "exact answer from story"},
    {"question": "Why did this happen?", "answer": "exact answer from story"}
  ],
  "emotionQuiz": [
    {"question": "How does the character feel at the beginning?", "options": ["happy", "sad", "excited", "worried"], "correct": 0},
    {"question": "How does the character feel at the end?", "options": ["happy", "sad", "excited", "worried"], "correct": 0}
  ],
  "bmeStory": {
    "beginning": "What happens at the start of the story",
    "middle": "What happens in the middle of the story", 
    "end": "What happens at the end of the story"
  },
  "sentenceOrder": {
    "sentences": ["First event sentence", "Second event sentence", "Third event sentence"],
    "correctOrder": [1, 2, 3]
  },
  "threeLineSummary": {
    "line1": "First summary line",
    "line2": "Second summary line", 
    "line3": "Third summary line"
  },
  "sentenceCompletion": [
    {"sentence": "The character was _____ because they felt happy.", "answers": ["smiling"], "blanks": ["_____"]},
    {"sentence": "The story takes place in a _____.", "answers": ["park"], "blanks": ["_____"]}
  ],
  "drawAndTell": {
    "prompt": "Draw the main character doing their favorite activity",
    "questions": ["What is the character doing?", "How do they feel?", "What do you see around them?"]
  }
}

CRITICAL: Use EXACT characters, events, and details from the story. Return ONLY the JSON object.`
}

function parseComprehensiveResponse(response: string): StoryData {
  try {
    // Clean the response
    let cleanResponse = response.trim()
    
    // Remove markdown code blocks if present
    cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // Parse JSON
    const parsed = JSON.parse(cleanResponse)
    
    console.log('✅ Successfully parsed comprehensive response')
    return parsed
    
  } catch (error) {
    console.error('❌ Failed to parse comprehensive response:', error)
    console.log('Raw response:', response.substring(0, 500) + '...')
    throw new Error('Failed to parse AI response')
  }
}

function filterSelectedActivities(storyData: StoryData, selectedActivities: string[]): StoryData {
  const filtered: StoryData = {
    title: storyData.title,
    content: storyData.content
  }
  
  // Map activity IDs to property names
  const activityMap: Record<string, keyof StoryData> = {
    'wh-questions': 'whQuestions',
    'emotion-quiz': 'emotionQuiz', 
    'bme-story': 'bmeStory',
    'sentence-order': 'sentenceOrder',
    'three-line-summary': 'threeLineSummary',
    'sentence-completion': 'sentenceCompletion',
    'draw-and-tell': 'drawAndTell'
  }
  
  // Only include selected activities
  selectedActivities.forEach(activityId => {
    const propertyName = activityMap[activityId]
    if (propertyName && storyData[propertyName]) {
      (filtered as any)[propertyName] = storyData[propertyName]
    }
  })
  
  console.log('✅ Filtered activities:', selectedActivities)
  return filtered
}

async function generateWorksheetPDF(stories: StoryData[], activities: string[]): Promise<Buffer> {
  try {
    const pdfElement = React.createElement(WorksheetPDF, { 
      stories: stories,
      activities: activities
    }) as any  // Type assertion to avoid React PDF type conflicts
    
    const pdfBuffer = await renderToBuffer(pdfElement)
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length)
    return pdfBuffer
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    throw new Error('Failed to generate PDF')
  }
}
