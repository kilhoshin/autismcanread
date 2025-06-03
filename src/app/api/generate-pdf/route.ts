import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import { canDownloadPDF } from '@/utils/supabase'

// 한글 폰트 설정을 위한 인터페이스
interface PDFFont {
  addFont(): void
}

export async function POST(request: NextRequest) {
  try {
    const { activityType, storyContent, userAnswers, activityTitle, userId } = await request.json()

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

    // PDF 생성
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // 한글 지원을 위한 폰트 설정 (실제 운영에서는 한글 폰트 파일이 필요)
    pdf.setFont('helvetica', 'normal')
    
    let yPosition = 20

    // 헤더
    pdf.setFontSize(20)
    pdf.setTextColor(60, 60, 60)
    pdf.text('읽기친구 - 학습 활동 결과', 20, yPosition)
    yPosition += 15

    // 활동 제목
    pdf.setFontSize(16)
    pdf.setTextColor(220, 53, 69) // 빨간색
    pdf.text(activityTitle || '학습 활동', 20, yPosition)
    yPosition += 10

    // 날짜
    pdf.setFontSize(12)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`날짜: ${new Date().toLocaleDateString('ko-KR')}`, 20, yPosition)
    yPosition += 20

    // 활동별 내용 생성
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

    // 격려 메시지
    yPosition += 10
    pdf.setFontSize(14)
    pdf.setTextColor(40, 167, 69) // 녹색
    pdf.text('잘했어요! 계속 열심히 공부해요! 🌟', 20, yPosition)

    // PDF를 Base64로 변환
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
  // 이야기 섹션
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📖 이야기', 20, yPosition)
  yPosition += 10

  if (storyContent?.story) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(storyContent.story, 170)
    pdf.text(storyLines, 20, yPosition)
    yPosition += storyLines.length * 5 + 10
  }

  // B-M-E 분석
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('🔍 B-M-E 분석 결과', 20, yPosition)
  yPosition += 15

  // Beginning
  pdf.setFontSize(12)
  pdf.setTextColor(220, 53, 69)
  pdf.text('📚 Beginning (시작):', 20, yPosition)
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
  pdf.text('📖 Middle (중간):', 20, yPosition)
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
  pdf.text('📚 End (끝):', 20, yPosition)
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
  // WH 질문 활동용 PDF 생성
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('❓ WH 질문 활동 결과', 20, yPosition)
  yPosition += 15

  if (storyContent?.story) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('📖 이야기:', 20, yPosition)
    yPosition += 8
    
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(storyContent.story, 170)
    pdf.text(storyLines, 25, yPosition)
    yPosition += storyLines.length * 5 + 15
  }

  // 질문과 답변들
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
  // 감정 예측 퀴즈용 PDF 생성
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('😊 감정 예측 퀴즈 결과', 20, yPosition)
  yPosition += 15

  // 구현 내용...
  return yPosition
}

function generateSentenceOrderPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // 문장 순서 맞추기 활동용 PDF 생성
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📚 문장 순서 맞추기 활동 결과', 20, yPosition)
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
    pdf.text('📝 사용자 답변:', 20, yPosition)
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
  // 세줄 요약하기 활동용 PDF 생성
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📝 세줄 요약하기 활동 결과', 20, yPosition)
  yPosition += 15

  // 원본 이야기
  if (storyContent) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text('원본 이야기:', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(storyContent, 170)
    pdf.text(storyLines, 20, yPosition)
    yPosition += storyLines.length * 5 + 15
  }

  // 사용자 요약
  if (userAnswers && userAnswers.userSummary) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('사용자 요약:', 20, yPosition)
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

  // 요약 가이드 (참고용)
  if (userAnswers && userAnswers.summaryGuide) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('참고 가이드:', 20, yPosition)
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
  // 문장 완성하기 활동용 PDF 생성
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('✏️ 문장 완성하기 활동 결과', 20, yPosition)
  yPosition += 15

  // 점수 표시
  if (userAnswers && userAnswers.score !== undefined) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text(`점수: ${userAnswers.score}점`, 20, yPosition)
    yPosition += 15
  }

  // 원본 이야기
  if (storyContent) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text('원본 이야기:', 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    const storyLines = pdf.splitTextToSize(storyContent, 170)
    pdf.text(storyLines, 20, yPosition)
    yPosition += storyLines.length * 5 + 15
  }

  // 문제별 답안 확인
  if (userAnswers && userAnswers.blanks && userAnswers.userAnswers) {
    pdf.setFontSize(12)
    pdf.setTextColor(60, 60, 60)
    pdf.text('답안 확인:', 20, yPosition)
    yPosition += 10

    userAnswers.blanks.forEach((blank: any, index: number) => {
      const userAnswer = userAnswers.userAnswers[index] || '(미입력)'
      const isCorrect = userAnswer.trim().toLowerCase() === blank.answer.toLowerCase()

      // 문제 번호
      pdf.setFontSize(10)
      pdf.setTextColor(40, 40, 40)
      pdf.text(`문제 ${index + 1}:`, 25, yPosition)
      yPosition += 7

      // 문제 문장
      pdf.setFontSize(9)
      pdf.setTextColor(80, 80, 80)
      const questionLines = pdf.splitTextToSize(blank.withBlank, 165)
      pdf.text(questionLines, 25, yPosition)
      yPosition += questionLines.length * 4 + 3

      // 답안
      pdf.setFontSize(9)
      if (isCorrect) {
        pdf.setTextColor(34, 139, 34)
      } else {
        pdf.setTextColor(220, 20, 60)
      }
      pdf.text(`내 답: ${userAnswer}`, 25, yPosition)
      pdf.text(`정답: ${blank.answer}`, 100, yPosition)
      pdf.text(isCorrect ? '✓ 정답' : '✗ 오답', 150, yPosition)
      yPosition += 10
    })
  }

  return yPosition
}

function generateDrawAndTellPDF(pdf: jsPDF, storyContent: any, userAnswers: any, yPosition: number): number {
  // 그림 그리고 말하기 활동용 PDF 생성
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('🎨 그림 그리고 말하기 활동 결과', 20, yPosition)
  yPosition += 15

  // 주제
  if (userAnswers && userAnswers.topic) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text(`주제: ${userAnswers.topic}`, 20, yPosition)
    yPosition += 15
  }

  // 그림 (이미지 데이터가 있는 경우)
  if (userAnswers && userAnswers.imageData) {
    try {
      pdf.setFontSize(12)
      pdf.setTextColor(40, 40, 40)
      pdf.text('그린 그림:', 20, yPosition)
      yPosition += 10

      // 이미지 추가 (실제 구현에서는 base64 이미지 처리)
      pdf.addImage(userAnswers.imageData, 'PNG', 20, yPosition, 100, 67)
      yPosition += 75
    } catch (error) {
      pdf.setFontSize(10)
      pdf.setTextColor(120, 120, 120)
      pdf.text('(그림을 PDF에 포함할 수 없습니다)', 20, yPosition)
      yPosition += 10
    }
  }

  // 사용자 이야기
  if (userAnswers && userAnswers.story) {
    pdf.setFontSize(12)
    pdf.setTextColor(40, 40, 40)
    pdf.text('만든 이야기:', 20, yPosition)
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
  // 일반적인 활동용 PDF 생성
  pdf.setFontSize(14)
  pdf.setTextColor(60, 60, 60)
  pdf.text('📚 학습 활동 결과', 20, yPosition)
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
    'WHO': '누가',
    'WHAT': '무엇을',
    'WHEN': '언제',
    'WHERE': '어디서',
    'WHY': '왜',
    'HOW': '어떻게'
  }
  return translations[type] || type
}
