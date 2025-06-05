import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import { canDownloadPDF } from '@/utils/supabase'

// Font configuration for Korean text support (requires Korean font files in production)
interface PDFFont {
  addFont(): void
}

export async function POST(request: NextRequest) {
  try {
    const { activityType, storyContent, userAnswers, activityTitle, userId } = await request.json()

    // Debug logging
    console.log('=== PDF Generation Debug ===')
    console.log('Activity Type:', activityType)
    console.log('Story Content:', storyContent)
    console.log('User Answers:', userAnswers)
    console.log('Activity Title:', activityTitle)
    console.log('User ID:', userId)
    console.log('============================')

    // Check if user has premium subscription for PDF download
    if (userId && !(await canDownloadPDF(userId))) {
      return NextResponse.json(
        { 
          error: 'Premium subscription required for PDF downloads',
          code: 'PREMIUM_REQUIRED' 
        },
        { status: 403 }
      )
    }

    // PDF creation
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Font configuration for Korean text support (requires Korean font files in production)
    pdf.setFont('helvetica', 'normal')
    
    let yPosition = 20

    // Header
    pdf.setFontSize(20)
    pdf.setTextColor(220, 53, 69) // Bright red
    pdf.text('📚 Reading Friends - Learning Activity Results', 20, yPosition)
    yPosition += 15

    // Activity title
    pdf.setFontSize(16)
    pdf.setTextColor(40, 167, 69) // Green
    pdf.text(`🎯 ${activityTitle || 'Learning Activity'}`, 20, yPosition)
    yPosition += 10

    // Date
    pdf.setFontSize(12)
    pdf.setTextColor(108, 117, 125) // Gray
    pdf.text(`📅 Date: ${new Date().toLocaleDateString('ko-KR')}`, 20, yPosition)
    yPosition += 20

    // Generate activity-specific content
    switch (activityType) {
      case 'bme-story':
        yPosition = generateBMEPDF(pdf, storyContent, userAnswers, yPosition)
        break
      case 'wh-questions':
        yPosition = generateWHPDF(pdf, storyContent, userAnswers, yPosition)
        break
      case 'emotion-quiz':
        yPosition = generateEmotionPDF(pdf, storyContent, userAnswers, yPosition)
        break
      case 'sentence-order':
        yPosition = generateSentenceOrderPDF(pdf, storyContent, userAnswers, yPosition)
        break
      case 'three-line-summary':
        yPosition = generateThreeLineSummaryPDF(pdf, storyContent, userAnswers, yPosition)
        break
      case 'sentence-completion':
        yPosition = generateSentenceCompletionPDF(pdf, storyContent, userAnswers, yPosition)
        break
      case 'draw-and-tell':
        yPosition = generateDrawAndTellPDF(pdf, storyContent, userAnswers, yPosition)
        break
      default:
        yPosition = generateGenericPDF(pdf, storyContent, userAnswers, yPosition)
    }

    // Encouragement message
    yPosition += 15
    pdf.setFontSize(16)
    pdf.setTextColor(220, 53, 69) // Red
    pdf.text('🌟 Excellent Work! 🌟', 20, yPosition)
    yPosition += 10
    
    pdf.setFontSize(12)
    pdf.setTextColor(40, 167, 69) // Green
    pdf.text('Keep practicing and improving your reading skills!', 20, yPosition)
    yPosition += 8
    
    pdf.setFontSize(10)
    pdf.setTextColor(108, 117, 125) // Gray
    pdf.text('💪 You are doing amazing! Every step makes you stronger! 🚀', 20, yPosition)

    // Convert PDF to Base64
    const pdfBase64 = pdf.output('datauristring')

    return NextResponse.json({
      success: true,
      pdfData: pdfBase64,
      filename: `reading-activity-${Date.now()}.pdf`
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generateBMEPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // Story section
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📖 Story', 20, yPosition)
  yPosition += 10

  if (storyContent?.story) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(storyContent.story, 170)
    pdf.text(storyLines, 20, yPosition)
    yPosition += storyLines.length * 5 + 10
  }

  // B-M-E analysis
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('🔍 B-M-E Analysis Results', 20, yPosition)
  yPosition += 15

  // Beginning
  pdf.setFontSize(12)
  pdf.setTextColor(220, 53, 69)
  pdf.text('📚 Beginning (Start):', 20, yPosition)
  yPosition += 8
  if (userAnswers?.beginning) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const beginningLines = pdf.splitTextToSize(userAnswers.beginning, 170)
    pdf.text(beginningLines, 25, yPosition)
    yPosition += beginningLines.length * 5 + 10
  }

  // Middle
  pdf.setFontSize(12)
  pdf.setTextColor(255, 193, 7)
  pdf.text('📖 Middle (Middle):', 20, yPosition)
  yPosition += 8
  if (userAnswers?.middle) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const middleLines = pdf.splitTextToSize(userAnswers.middle, 170)
    pdf.text(middleLines, 25, yPosition)
    yPosition += middleLines.length * 5 + 10
  }

  // End
  pdf.setFontSize(12)
  pdf.setTextColor(40, 167, 69)
  pdf.text('📚 End (End):', 20, yPosition)
  yPosition += 8
  if (userAnswers?.end) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const endLines = pdf.splitTextToSize(userAnswers.end, 170)
    pdf.text(endLines, 25, yPosition)
    yPosition += endLines.length * 5 + 10
  }

  return yPosition
}

function generateWHPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // WH questions activity PDF generation
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('❓ WH Questions Activity Results', 20, yPosition)
  yPosition += 15

  if (storyContent?.story) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('📖 Story:', 20, yPosition)
    yPosition += 8
    
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(storyContent.story, 170)
    pdf.text(storyLines, 25, yPosition)
    yPosition += storyLines.length * 5 + 15
  }

  // Questions and answers
  const whTypes = ['WHO', 'WHAT', 'WHEN', 'WHERE', 'WHY', 'HOW']
  whTypes.forEach((type) => {
    if (userAnswers?.[type.toLowerCase()]) {
      pdf.setFontSize(12)
      pdf.setTextColor(13, 110, 253)
      pdf.text(`${type} (${getKoreanWH(type)}):`, 20, yPosition)
      yPosition += 8

      pdf.setFontSize(10)
      pdf.setTextColor(80, 80, 80)
      const answerLines = pdf.splitTextToSize(userAnswers[type.toLowerCase()], 170)
      pdf.text(answerLines, 25, yPosition)
      yPosition += answerLines.length * 5 + 8
    }
  })

  return yPosition
}

function generateEmotionPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // Emotion prediction quiz PDF generation
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('😊 Emotion Prediction Quiz Results', 20, yPosition)
  yPosition += 15

  // Implementation...
  return yPosition
}

function generateSentenceOrderPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // Sentence order activity PDF generation
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📚 Sentence Order Activity Results', 20, yPosition)
  yPosition += 15

  if (storyContent) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const contentText = typeof storyContent === 'string' ? storyContent : JSON.stringify(storyContent)
    const contentLines = pdf.splitTextToSize(contentText, 170)
    pdf.text(contentLines, 20, yPosition)
    yPosition += contentLines.length * 5 + 10
  }

  if (userAnswers) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('📝 User Answers:', 20, yPosition)
    yPosition += 8

    userAnswers.forEach((sentence: any, index: number) => {
      pdf.setFontSize(10)
      pdf.setTextColor(80, 80, 80)
      pdf.text(`${index + 1}. ${sentence.text}`, 25, yPosition)
      yPosition += 8
    })
  }

  return yPosition
}

function generateThreeLineSummaryPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // Three-line summary activity PDF generation
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📝 Three-Line Summary Activity Results', 20, yPosition)
  yPosition += 15

  // Original story
  if (storyContent) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text('📖 Original Story:', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    // Handle both string and object types
    const storyText = typeof storyContent === 'string' ? storyContent : storyContent?.story || storyContent
    const storyLines = pdf.splitTextToSize(storyText, 170)
    pdf.text(storyLines, 20, yPosition)
    yPosition += storyLines.length * 5 + 15
  }

  // User summary
  if (userAnswers && userAnswers.userSummary) {
    pdf.setFontSize(12)
    pdf.setTextColor(220, 53, 69) // Red color
    pdf.text('✏️ Your Three-Line Summary:', 20, yPosition)
    yPosition += 10

    userAnswers.userSummary.forEach((line: string, index: number) => {
      if (line.trim()) {
        pdf.setFontSize(10)
        pdf.setTextColor(80, 80, 80)
        const summaryLines = pdf.splitTextToSize(`${index + 1}. ${line}`, 165)
        pdf.text(summaryLines, 25, yPosition)
        yPosition += summaryLines.length * 5 + 3
      }
    })
    yPosition += 10
  }

  // Summary guide (reference)
  if (userAnswers && userAnswers.summaryGuide) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('Summary Guide (Reference):', 20, yPosition)
    yPosition += 10

    userAnswers.summaryGuide.forEach((guide: string, index: number) => {
      pdf.setFontSize(10)
      pdf.setTextColor(120, 120, 120)
      const guideLines = pdf.splitTextToSize(`${index + 1}. ${guide}`, 165)
      pdf.text(guideLines, 25, yPosition)
      yPosition += guideLines.length * 5 + 3
    })
  }

  return yPosition
}

function generateSentenceCompletionPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // Sentence completion activity PDF generation
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('✏️ Sentence Completion Activity Results', 20, yPosition)
  yPosition += 15

  // Score display
  if (userAnswers && userAnswers.score !== undefined) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text(`Score: ${userAnswers.score} points`, 20, yPosition)
    yPosition += 15
  }

  // Original story
  if (storyContent) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Original Story:', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(storyContent, 170)
    pdf.text(storyLines, 20, yPosition)
    yPosition += storyLines.length * 5 + 15
  }

  // Question-by-question answers
  if (userAnswers && userAnswers.blanks && userAnswers.userAnswers) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('Answer Key:', 20, yPosition)
    yPosition += 10

    userAnswers.blanks.forEach((blank: any, index: number) => {
      const userAnswer = userAnswers.userAnswers[index] || '(Not answered)'
      const isCorrect = userAnswer.trim().toLowerCase() === blank.answer.toLowerCase()

      // Question number
      pdf.setFontSize(10)
      pdf.setTextColor(40, 40, 40)
      pdf.text(`Question ${index + 1}:`, 25, yPosition)
      yPosition += 7

      // Question sentence
      pdf.setFontSize(9)
      pdf.setTextColor(80, 80, 80)
      const questionLines = pdf.splitTextToSize(blank.withBlank, 165)
      pdf.text(questionLines, 25, yPosition)
      yPosition += questionLines.length * 4 + 3

      // Answer
      pdf.setFontSize(9)
      if (isCorrect) {
        pdf.setTextColor(34, 139, 34)
      } else {
        pdf.setTextColor(220, 20, 60)
      }
      pdf.text(`Your answer: ${userAnswer}`, 25, yPosition)
      pdf.text(`Correct answer: ${blank.answer}`, 100, yPosition)
      pdf.text(isCorrect ? '✓ Correct' : '✗ Incorrect', 150, yPosition)
      yPosition += 10
    })
  }

  return yPosition
}

function generateDrawAndTellPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // Draw and tell activity PDF generation
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('🎨 Draw and Tell Activity Results', 20, yPosition)
  yPosition += 15

  // Topic
  if (userAnswers && userAnswers.topic) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text(`Topic: ${userAnswers.topic}`, 20, yPosition)
    yPosition += 15
  }

  // Drawing (if image data is available)
  if (userAnswers && userAnswers.imageData) {
    try {
      pdf.setFontSize(12)
      pdf.setTextColor(40, 40, 40)
      pdf.text('Drawing:', 20, yPosition)
      yPosition += 10

      // Add image (actual implementation would handle base64 image)
      pdf.addImage(userAnswers.imageData, 'PNG', 20, yPosition, 100, 67)
      yPosition += 75
    } catch (error) {
      pdf.setFontSize(10)
      pdf.setTextColor(120, 120, 120)
      pdf.text('(Unable to include drawing in PDF)', 20, yPosition)
      yPosition += 10
    }
  }

  // User story
  if (userAnswers && userAnswers.story) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text('User Story:', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(userAnswers.story, 170)
    pdf.text(storyLines, 20, yPosition)
    yPosition += storyLines.length * 5 + 10
  }

  return yPosition
}

function generateGenericPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // Generic activity PDF generation
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📚 Learning Activity Results', 20, yPosition)
  yPosition += 15

  if (storyContent) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const contentText = typeof storyContent === 'string' ? storyContent : JSON.stringify(storyContent)
    const contentLines = pdf.splitTextToSize(contentText, 170)
    pdf.text(contentLines, 20, yPosition)
    yPosition += contentLines.length * 5 + 10
  }

  return yPosition
}

function getKoreanWH(type: string): string {
  const translations: { [key: string]: string } = {
    'WHO': 'Who',
    'WHAT': 'What',
    'WHEN': 'When',
    'WHERE': 'Where',
    'WHY': 'Why',
    'HOW': 'How'
  }
  return translations[type] || type
}
