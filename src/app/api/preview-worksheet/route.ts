import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import jsPDF from 'jspdf'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface WorksheetRequest {
  topics: string[]
  activities: string[]
  count: number
  readingLevel: number
  writingLevel: number
}

interface StoryData {
  title: string
  content: string
  whQuestions?: {question: string; answer?: string}[]
  emotionQuiz?: {question: string; options: string[]; correct?: number; correctAnswer?: string}[]
  bmeStory?: {beginning?: string; middle?: string; end?: string}
  sentenceOrder?: {sentences: string[]; correctOrder?: number[]}
  threeLineSummary?: {summary?: string[]; line1?: string; line2?: string; line3?: string}
  sentenceCompletion?: {sentence: string; answers: string[]; blanks: string[]}[]
  drawAndTell?: {prompt: string; questions: string[]}
}

// Helper function to extract answer from question text - improved for any story context
function extractAnswerFromQuestion(question: string, storyContent?: string): string {
  return 'Using unified AI generation - this function is deprecated'
}

// Helper function to generate sentence completion answers - improved for any story context  
function generateSentenceCompletionAnswer(sentence: string, storyContent?: string): string {
  return 'Using unified AI generation - this function is deprecated'
}

// AI prompt generation functions
function generateCompleteWorksheetPrompt(topic: string, readingLevel: number, selectedActivities: string[]): string {
  // Add random elements to ensure story variety
  const randomElements = [
    { characters: ['Emma', 'Leo', 'Maya', 'Sam', 'Alex', 'Zoe', 'Ben', 'Luna'], 
      settings: ['morning', 'afternoon', 'weekend', 'after school', 'summer day'],
      moods: ['excited', 'curious', 'determined', 'cheerful', 'thoughtful'] },
    { characters: ['Sunny', 'River', 'Sky', 'Sage', 'Robin', 'Phoenix', 'Ocean'], 
      settings: ['park', 'garden', 'kitchen', 'backyard', 'living room'],
      moods: ['happy', 'focused', 'creative', 'patient', 'enthusiastic'] }
  ]
  
  const randomSet = randomElements[Math.floor(Math.random() * randomElements.length)]
  const randomCharacter = randomSet.characters[Math.floor(Math.random() * randomSet.characters.length)]
  const randomSetting = randomSet.settings[Math.floor(Math.random() * randomSet.settings.length)]
  const randomMood = randomSet.moods[Math.floor(Math.random() * randomSet.moods.length)]
  const storyId = Math.random().toString(36).substring(2, 8)
  
  return `
Create a UNIQUE and ORIGINAL reading comprehension worksheet for children with autism spectrum and ADHD in English.

Topic: ${topic}
Reading Level: Grade ${readingLevel}
Target: Children with autism spectrum and ADHD
Story ID: ${storyId} (make this story completely different from any previous ones)

STORY VARIETY REQUIREMENTS:
- Main character: ${randomCharacter} (use this name specifically)
- Setting: ${randomSetting} context
- Character mood: ${randomMood}
- Make the story plot completely unique and original
- Avoid repeating common story patterns

Requirements:
- Create ONE completely original story (150-300 words) with simple, clear language
- Generate ALL 7 activity types with COMPLETE answers
- Make questions simple and concrete for special education
- Use clear, direct language appropriate for Grade ${readingLevel}
- Base all activities directly on the story content

Return in this EXACT JSON format with ALL fields filled:
{
  "title": "Story title here",
  "content": "Complete story text here (150-300 words)",
  "wh_questions": [
    {"question": "Who is the main character in the story?", "answer": "${randomCharacter}"},
    {"question": "What does ${randomCharacter} do in the story?", "answer": "specific action from story"},
    {"question": "Where does ${randomCharacter} go?", "answer": "specific location"},
    {"question": "When does the story happen?", "answer": "time from story"},
    {"question": "Why does ${randomCharacter} [action]?", "answer": "reason from story"}
  ],
  "emotion_quiz": [
    {
      "question": "How does ${randomCharacter} feel when [situation]?",
      "options": ["Happy", "Sad", "Excited", "Worried"],
      "correct_answer": "Happy",
      "correct": 0
    }
  ],
  "bme_story": {
    "beginning": "What happens at the start",
    "middle": "What happens in the middle", 
    "end": "What happens at the end"
  },
  "sentence_order": {
    "sentences": ["First event from story", "Second event from story", "Third event from story", "Fourth event from story"]
  },
  "three_line_summary": {
    "line1": "First main point",
    "line2": "Second main point", 
    "line3": "Third main point"
  },
  "sentence_completion": [
    {"sentence": "${randomCharacter} went to _____ because _____.", "answers": ["school", "${randomCharacter} wanted to learn"], "blanks": ["_____", "_____"]},
    {"sentence": "${randomCharacter} felt _____ when _____.", "answers": ["happy", "${randomCharacter} saw friends"], "blanks": ["_____", "_____"]},
    {"sentence": "${randomCharacter} learned _____.", "answers": ["something new"], "blanks": ["_____"]}
  ],
  "draw_and_tell": {
    "prompt": "Draw your favorite scene from the story",
    "questions": ["What did you draw and why?", "How does ${randomCharacter} feel in this scene?"]
  }
}

CRITICAL: 
- Include COMPLETE answers for ALL wh_questions
- Include SPECIFIC answers for ALL sentence_completion items
- Include correct index (0-3) for emotion_quiz items
- Base ALL answers directly on the story content
- Make sure the story is engaging and appropriate for special education
- Use concrete, specific answers, not generic ones
- Use the character name (${randomCharacter}) consistently in ALL sentences
- NEVER use pronouns like "they", "he", "she" - always use the character's name
- Each sentence must contain exactly the number of blanks specified
- Make sure blanks match the story content exactly
`
}

// AI response parsing function
function parseAIResponse(response: string, activityTypes: string[], storyContent?: string): Partial<StoryData> {
  try {
    // Remove JSON code block markdown if present
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
    
    // DEBUG: Log activity types received
    console.log('Activity types received:', activityTypes)
    
    // Convert AI format to our expected format if needed
    const activityTypeHandlers: { [key: string]: (parsed: any) => void } = {
      whQuestions: (parsed) => {
        console.log('🟢 Processing WH Questions...')
        if (parsed.whQuestions && Array.isArray(parsed.whQuestions)) {
          console.log('Original WH Questions:', parsed.whQuestions)
          
          parsed.whQuestions.forEach((q: any, index: number) => {
            console.log(`Question ${index + 1}:`, q)
            if (!q.answer) {
              console.log('Missing answer, generating fallback...')
              q.answer = extractAnswerFromQuestion(q.question || 'Sample question', storyContent)
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
        console.log('🟢 Processing Emotion Quiz...')
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
        if (parsed.bmeStory) {
          result.bmeStory = parsed.bmeStory
        }
      },
      sentenceOrder: (parsed) => {
        if (parsed.sentenceOrder) {
          result.sentenceOrder = parsed.sentenceOrder
        }
      },
      threeLineSummary: (parsed) => {
        if (parsed.threeLineSummary) {
          result.threeLineSummary = parsed.threeLineSummary
        }
      },
      sentenceCompletion: (parsed) => {
        if (parsed.sentenceCompletion && Array.isArray(parsed.sentenceCompletion)) {
          console.log('Processing Sentence Completion...')
          console.log('Original Sentence Completion:', parsed.sentenceCompletion)
          
          // Add missing blank field if not present and generate answers
          parsed.sentenceCompletion.forEach((item: any, index: number) => {
            console.log(`Sentence ${index + 1}:`, item)
            
            if (!item.blanks && item.sentence) {
              // Extract the blanks from the sentence (text with ___)
              const blankMatches = item.sentence.match(/___+/g)
              if (blankMatches) {
                item.blanks = blankMatches
              }
            }
            
            // Generate answers if missing
            if (!item.answers) {
              console.log('Missing answers, generating fallback...')
              item.answers = item.blanks.map(() => generateSentenceCompletionAnswer(item.sentence || '', storyContent))
              console.log('Added missing answers:', item.answers)
            }
          })
          
          console.log('Final Sentence Completion:', parsed.sentenceCompletion)
          result.sentenceCompletion = parsed.sentenceCompletion
        }
      },
      drawAndTell: (parsed) => {
        if (parsed.drawAndTell) {
          result.drawAndTell = parsed.drawAndTell
        }
      }
    }
    
    // DEBUG: Log available handlers after declaration
    console.log('Available handlers:', Object.keys(activityTypeHandlers))
    
    activityTypes.forEach((type) => {
      // Convert dash-case activity types to camelCase to match handlers
      let handlerKey = type
      if (type === 'wh-questions') handlerKey = 'whQuestions'
      if (type === 'emotion-quiz') handlerKey = 'emotionQuiz'
      if (type === 'sentence-order') handlerKey = 'sentenceOrder'
      if (type === 'bme-story') handlerKey = 'bmeStory'
      if (type === 'three-line-summary') handlerKey = 'threeLineSummary'
      if (type === 'sentence-completion') handlerKey = 'sentenceCompletion'
      if (type === 'draw-and-tell') handlerKey = 'drawAndTell'
      
      console.log(`Converting activity type: ${type} → ${handlerKey}`)
      
      if (activityTypeHandlers[handlerKey]) {
        console.log(`🟢 Executing handler for ${handlerKey}...`)
        activityTypeHandlers[handlerKey](parsed)
        console.log(`🟢 Handler for ${handlerKey} executed successfully`)
      } else {
        console.log(`❌ No handler found for ${handlerKey}`)
      }
    })
    
    console.log('Final parsed result:', result)
    return result
  } catch (error) {
    console.error('AI response parsing failed:', error)
    return {}
  }
}

// PDF generation function
function createWorksheetPDF(stories: StoryData[]): string {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let yPosition = 20
  const lineHeight = 7
  const pageHeight = 297
  const margin = 20
  const maxWidth = 170

  stories.forEach((story, storyIndex) => {
    if (storyIndex > 0) {
      doc.addPage()
      yPosition = 20
    }

    // Title
    doc.setFontSize(18)
    doc.setTextColor(0, 100, 200)
    doc.text(story.title, margin, yPosition, { align: 'center', maxWidth })
    yPosition += lineHeight * 2

    // Story content
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    const storyLines = doc.splitTextToSize(story.content, maxWidth)
    
    storyLines.forEach((line: string) => {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })

    yPosition += lineHeight * 2

    // WH Questions Activity
    if (story.whQuestions) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setTextColor(200, 100, 0)
      doc.text('❓ WH Questions', margin, yPosition)
      yPosition += lineHeight * 2

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      story.whQuestions.forEach((q, index) => {
        if (yPosition + lineHeight * 3 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(`${index + 1}. ${q.question}`, margin, yPosition)
        yPosition += lineHeight * 1.5
        doc.text('Answer: ___________________________', margin + 5, yPosition)
        yPosition += lineHeight * 2
      })
      yPosition += lineHeight
    }

    // Emotion Quiz Activity
    if (story.emotionQuiz) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setTextColor(200, 50, 150)
      doc.text('😊 Emotion Quiz', margin, yPosition)
      yPosition += lineHeight * 2

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      story.emotionQuiz.forEach((q, index) => {
        if (yPosition + lineHeight * 5 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(`${index + 1}. ${q.question}`, margin, yPosition)
        yPosition += lineHeight * 1.5
        
        q.options.forEach((option, optIndex) => {
          doc.text(`   ${String.fromCharCode(97 + optIndex)}) ${option}`, margin + 5, yPosition)
          yPosition += lineHeight
        })
        yPosition += lineHeight
      })
      yPosition += lineHeight
    }

    // BME Story Activity
    if (story.bmeStory) {
      if (yPosition + 50 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setTextColor(0, 150, 200)
      doc.text('📖 BME Story Structure', margin, yPosition)
      yPosition += lineHeight * 2

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      
      doc.text('Beginning:', margin, yPosition)
      yPosition += lineHeight
      doc.text(story.bmeStory.beginning || '_________________________________________________', margin, yPosition)
      yPosition += lineHeight * 2
      
      doc.text('Middle:', margin, yPosition)
      yPosition += lineHeight
      doc.text(story.bmeStory.middle || '_________________________________________________', margin, yPosition)
      yPosition += lineHeight * 2
      
      doc.text('End:', margin, yPosition)
      yPosition += lineHeight
      doc.text(story.bmeStory.end || '_________________________________________________', margin, yPosition)
      yPosition += lineHeight * 2
    }

    // Sentence Order Activity
    if (story.sentenceOrder) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setTextColor(100, 100, 200)
      doc.text('🔢 Sentence Order', margin, yPosition)
      yPosition += lineHeight * 2

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Put these sentences in the correct order:', margin, yPosition)
      yPosition += lineHeight * 1.5
      
      story.sentenceOrder.sentences.forEach((sentence, index) => {
        if (yPosition + lineHeight * 2 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(`${index + 1}. ${sentence}`, margin, yPosition)
        yPosition += lineHeight * 1.5
      })
      yPosition += lineHeight
    }

    // Three Line Summary Activity
    if (story.threeLineSummary) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setTextColor(150, 100, 0)
      doc.text('📝 Three Line Summary', margin, yPosition)
      yPosition += lineHeight * 2

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text('Summarize the story in 3 lines:', margin, yPosition)
      yPosition += lineHeight * 2
      
      for (let i = 1; i <= 3; i++) {
        doc.text(`${i}. _________________________________________________`, margin, yPosition)
        yPosition += lineHeight * 2
      }
      yPosition += lineHeight
    }

    // Sentence Completion Activity
    if (story.sentenceCompletion) {
      if (yPosition + 40 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setTextColor(0, 150, 100)
      doc.text('✏️ Sentence Completion', margin, yPosition)
      yPosition += lineHeight * 2

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      story.sentenceCompletion.forEach((s, index) => {
        if (yPosition + lineHeight * 2 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(`${index + 1}. ${s.sentence}`, margin, yPosition)
        yPosition += lineHeight * 2
        
        s.blanks.forEach((blank, blankIndex) => {
          doc.text(`   ${blankIndex + 1}. ${blank} ___________________________`, margin + 5, yPosition)
          yPosition += lineHeight
        })
      })
      yPosition += lineHeight
    }

    // Draw and Tell Activity
    if (story.drawAndTell) {
      if (yPosition + 100 > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(16)
      doc.setTextColor(150, 0, 200)
      doc.text('🎨 Draw and Tell', margin, yPosition)
      yPosition += lineHeight * 2

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(story.drawAndTell.prompt, margin, yPosition)
      yPosition += lineHeight * 2

      // Drawing space
      doc.rect(margin, yPosition, maxWidth, 60)
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text('Drawing Space', margin + maxWidth/2, yPosition + 30, { align: 'center' })
      yPosition += 65

      // Questions
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      story.drawAndTell.questions.forEach((q, index) => {
        if (yPosition + lineHeight * 3 > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        doc.text(`${index + 1}. ${q}`, margin, yPosition)
        yPosition += lineHeight * 1.5
        doc.text('Answer: ___________________________', margin + 5, yPosition)
        yPosition += lineHeight * 2
      })
    }
  })

  return doc.output('datauristring').split(',')[1] // Return base64 string
}

export async function POST(request: NextRequest) {
  try {
    const { topics, activities, count, readingLevel, writingLevel }: WorksheetRequest = await request.json()

    if (!topics || !activities || !count) {
      return NextResponse.json({ error: 'Required parameters are missing.' }, { status: 400 })
    }

    const stories: StoryData[] = []

    // Create multiple stories and activities for preview based on count
    for (let i = 0; i < count; i++) {
      const randomTopic = topics[Math.floor(Math.random() * topics.length)]
      
      // 1. Generate complete worksheet with one AI call
      const worksheetPrompt = generateCompleteWorksheetPrompt(randomTopic, readingLevel, activities)
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7, // Higher temperature for more story variety
          topP: 0.9,
          topK: 50
        }
      })
      
      let worksheetResult
      try {
        console.log('🎯 Generating complete worksheet...')
        worksheetResult = await model.generateContent(worksheetPrompt)
        const worksheetResponse = worksheetResult.response.text()
        console.log('📝 Complete worksheet response:', worksheetResponse)
        
        // Remove JSON code block
        let cleanResponse = worksheetResponse.trim()
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        }
        if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }
        
        const completeData = JSON.parse(cleanResponse)
        console.log('✅ Parsed complete data:', completeData)
        
        // Convert snake_case to camelCase
        const storyData = {
          title: completeData.title,
          content: completeData.content,
          whQuestions: completeData.wh_questions,
          emotionQuiz: completeData.emotion_quiz,
          bmeStory: completeData.bme_story,
          sentenceOrder: completeData.sentence_order,
          threeLineSummary: completeData.three_line_summary,
          sentenceCompletion: completeData.sentence_completion,
          drawAndTell: completeData.draw_and_tell
        }
        
        // Filter to only include selected activities
        const filteredStory: any = {
          title: storyData.title,
          content: storyData.content
        }
        
        activities.forEach(activity => {
          const activityKey = activity.replace('-', '').replace('questions', 'Questions').replace('quiz', 'Quiz').replace('story', 'Story').replace('order', 'Order').replace('summary', 'Summary').replace('completion', 'Completion').replace('tell', 'Tell')
          
          if (activity === 'wh-questions' && storyData.whQuestions) {
            filteredStory.whQuestions = storyData.whQuestions
          }
          if (activity === 'emotion-quiz' && storyData.emotionQuiz) {
            filteredStory.emotionQuiz = storyData.emotionQuiz
          }
          if (activity === 'bme-story' && storyData.bmeStory) {
            filteredStory.bmeStory = storyData.bmeStory
          }
          if (activity === 'sentence-order' && storyData.sentenceOrder) {
            filteredStory.sentenceOrder = storyData.sentenceOrder
          }
          if (activity === 'three-line-summary' && storyData.threeLineSummary) {
            filteredStory.threeLineSummary = storyData.threeLineSummary
          }
          if (activity === 'sentence-completion' && storyData.sentenceCompletion) {
            filteredStory.sentenceCompletion = storyData.sentenceCompletion
          }
          if (activity === 'draw-and-tell' && storyData.drawAndTell) {
            filteredStory.drawAndTell = storyData.drawAndTell
          }
        })
        
        console.log('🎯 Filtered story with selected activities:', filteredStory)
        stories.push(filteredStory)
        
      } catch (aiError) {
        console.error('AI generation failed for story', i + 1, ':', aiError)
        
        // Use sample data if AI generation fails
        const sampleStory: StoryData = {
          title: `Sample Story ${i + 1}`,
          content: `This is a sample story about ${randomTopic}. The story is designed for children with autism spectrum and ADHD.`,
          ...parseAIResponse('{}', activities)
        }
        
        stories.push(sampleStory)
      }
    }

    // 3. Generate PDF
    const pdfBase64 = createWorksheetPDF(stories)

    // Debug: Log final response data
    console.log('Final API Response - Stories count:', stories.length)
    stories.forEach((story, index) => {
      console.log(`Story ${index + 1}:`, {
        title: story.title,
        hasWhQuestions: !!story.whQuestions && story.whQuestions.length > 0,
        hasEmotionQuiz: !!story.emotionQuiz && story.emotionQuiz.length > 0,
        hasBmeStory: !!story.bmeStory,
        hasSentenceOrder: !!story.sentenceOrder,
        hasThreeLineSummary: !!story.threeLineSummary,
        hasSentenceCompletion: !!story.sentenceCompletion && story.sentenceCompletion.length > 0,
        hasDrawAndTell: !!story.drawAndTell
      })
      if (story.whQuestions) {
        console.log(`WH Questions for story ${index + 1}:`, story.whQuestions)
      }
    })

    // Return story data and PDF for preview
    return NextResponse.json({ 
      success: true, 
      stories,
      pdfBase64,
      message: 'Preview generated successfully' 
    })

  } catch (error) {
    console.error('Preview generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate preview.' }, { status: 500 })
  }
}
