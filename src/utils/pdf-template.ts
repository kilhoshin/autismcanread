import { StoryData } from '../types/story'

export function generateWorksheetHTML(stories: StoryData[]): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Readers On The Spectrum - Worksheet</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'DejaVu Sans', 'Liberation Sans', 'Arial', 'Helvetica', sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #2c3e50;
      background: white;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .page-break {
      page-break-before: always !important;
      page-break-after: avoid !important;
      break-before: page !important;
      break-after: avoid !important;
      display: block !important;
      height: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      clear: both !important;
    }
    
    .section-header {
      text-align: center;
      margin: 0 0 20px 0;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      font-size: 20px;
      font-weight: bold;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .story-title {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      padding: 12px 16px;
      border-radius: 10px;
      margin: 15px 0;
      border-left: 5px solid #667eea;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .story-title .section-header {
      background: none;
      margin: 0;
      padding: 0;
      color: #2c3e50;
      font-size: 16px;
      text-shadow: none;
      box-shadow: none;
    }
    
    .story-box {
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
      border: 2px solid #e3e8ff;
      border-radius: 12px;
      padding: 20px;
      margin: 15px 0;
      min-height: 100px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      line-height: 1.6;
    }
    
    .activity-section {
      margin: 20px 0;
      padding: 16px;
      border-left: 5px solid #4CAF50;
      background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%);
      border-radius: 0 10px 10px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .activity-title {
      font-size: 15px;
      font-weight: bold;
      color: #2c5530;
      margin: 0 0 12px 0;
      padding: 8px 12px;
      background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
      border-radius: 8px;
      border-left: 4px solid #4CAF50;
    }
    
    .question {
      margin: 12px 0;
      font-weight: 500;
      color: #2c3e50;
      padding: 4px 0;
    }
    
    .answer-line {
      border-bottom: 1.5px solid #bbb;
      min-height: 24px;
      margin: 8px 0;
      width: 100%;
      display: block;
    }
    
    .answer-lines {
      margin: 10px 0 15px 0;
    }
    
    .multiple-choice {
      margin: 6px 0;
      padding-left: 16px;
      color: #34495e;
    }
    
    .drawing-box {
      border: 2px dashed #667eea;
      border-radius: 10px;
      height: 180px;
      margin: 15px 0;
      background: linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%);
      position: relative;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .drawing-box::before {
      content: "✏️ Draw your answer here";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #7f8c8d;
      font-size: 14px;
      text-align: center;
      font-style: italic;
    }
    
    .bme-section {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
      margin: 15px 0;
    }
    
    .bme-item {
      border: 2px solid #e8f4fd;
      border-radius: 10px;
      padding: 15px;
      background: linear-gradient(135deg, #f8f9ff 0%, #e8f4fd 100%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .bme-label {
      font-weight: bold;
      color: #667eea;
      margin-bottom: 8px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .sentence-order {
      margin: 8px 0;
      padding: 10px 12px;
      border: 2px solid #e3e8ff;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .sentence-order::before {
      content: "___";
      margin-right: 8px;
      font-weight: bold;
      color: #667eea;
    }
    
    .answer-key {
      background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
      border: 3px solid #f56565;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      box-shadow: 0 4px 12px rgba(245, 101, 101, 0.1);
      page-break-inside: avoid;
    }
    
    .answer-key h2 {
      color: #c53030;
      text-align: center;
      margin-bottom: 16px;
      font-size: 22px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .answer-text {
      color: #c53030;
      font-weight: 600;
      margin: 6px 0;
      padding: 4px 8px;
      background: rgba(255,255,255,0.6);
      border-radius: 4px;
    }
    
    /* 페이지 최적화 */
    .worksheet-content {
      page-break-inside: avoid;
    }
    
    .story-section {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-bottom: 20px;
    }
    
    /* 인쇄 최적화 */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      .answer-key {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="section-header">Reading Comprehension Worksheet</div>
  ${generateWorksheetContent(stories)}
  ${generateAnswerKey(stories)}
</body>
</html>
  `
}

function generateWorksheetContent(stories: StoryData[]): string {
  console.log(`🔍 Generating content for ${stories.length} stories`)
  
  return `
    <div class="worksheet-content">
      ${stories.map((story: StoryData, index: number) => {
        console.log(`📄 Processing story ${index + 1}: ${story.title}`)
        
        return `
        ${index > 0 ? `
          <div class="page-break" style="page-break-before: always !important; height: 1px; width: 100%;"></div>
          <div style="page-break-before: always !important;"></div>
        ` : ''}
        
        <div class="story-section" style="page-break-inside: avoid !important;">
          <div class="story-title">
            <div class="section-header">Story ${index + 1}: ${story.title || 'Reading Adventure'}</div>
          </div>
          
          <div class="story-box">
            ${story.content || story.story || 'Story content will be displayed here.'}
          </div>
          
          ${story.whQuestions ? `
            <div class="activity-section">
              <div class="activity-title">📝 Reading Comprehension Questions</div>
              ${story.whQuestions.map((q: any, i: number) => `
                <div class="question">${i + 1}. ${typeof q === 'string' ? q : q.question}</div>
                <div class="answer-lines">
                  <div class="answer-line"></div>
                  <div class="answer-line"></div>
                  <div class="answer-line"></div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${story.emotionQuiz ? `
            <div class="activity-section">
              <div class="activity-title">😊 Emotion Recognition</div>
              ${story.emotionQuiz.map((q: any, i: number) => `
                <div class="question">${i + 1}. ${q.question}</div>
                <div class="multiple-choice">
                  ${q.options?.map((option: string, optIndex: number) => `
                    <div>☐ ${String.fromCharCode(65 + optIndex)}. ${option}</div>
                  `).join('') || ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${story.drawAndTell ? `
            <div class="activity-section">
              <div class="activity-title">🎨 Draw and Tell</div>
              <div class="question">${story.drawAndTell.prompt}</div>
              <div class="drawing-box"></div>
              ${story.drawAndTell.questions ? story.drawAndTell.questions.map((q: string, i: number) => `
                <div class="question">${i + 1}. ${q}</div>
                <div class="answer-lines">
                  <div class="answer-line"></div>
                  <div class="answer-line"></div>
                </div>
              `).join('') : ''}
            </div>
          ` : ''}
          
          ${story.bmeStory ? `
            <div class="activity-section">
              <div class="activity-title">📚 Story Structure (Beginning, Middle, End)</div>
              <div class="bme-section">
                <div class="bme-item">
                  <div class="bme-label">Beginning</div>
                  <div class="answer-lines">
                    <div class="answer-line"></div>
                    <div class="answer-line"></div>
                  </div>
                </div>
                <div class="bme-item">
                  <div class="bme-label">Middle</div>
                  <div class="answer-lines">
                    <div class="answer-line"></div>
                    <div class="answer-line"></div>
                  </div>
                </div>
                <div class="bme-item">
                  <div class="bme-label">End</div>
                  <div class="answer-lines">
                    <div class="answer-line"></div>
                    <div class="answer-line"></div>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
          
          ${story.threeLineSummary ? `
            <div class="activity-section">
              <div class="activity-title">📝 Three Line Summary</div>
              <div class="question">Write a summary of the story in exactly three sentences:</div>
              <div class="answer-lines">
                <div class="answer-line"></div>
                <div class="answer-line"></div>
                <div class="answer-line"></div>
                <div class="answer-line"></div>
                <div class="answer-line"></div>
                <div class="answer-line"></div>
              </div>
            </div>
          ` : ''}
          
          ${story.sentenceOrder ? `
            <div class="activity-section">
              <div class="activity-title">🔢 Sentence Ordering</div>
              <div class="question">Put these sentences in the correct order by writing numbers 1-${story.sentenceOrder.sentences.length}:</div>
              ${story.sentenceOrder.sentences.map((sentence: string) => `
                <div class="sentence-order">☐ ${sentence}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        `
      }).join('')}
    </div>
  `
}

function generateAnswerKey(stories: StoryData[]): string {
  return `
    <div class="page-break"></div>
    
    <div class="answer-key">
      <h2>🔑 ANSWER KEY</h2>
      
      ${stories.map((story: StoryData, index: number) => `
        <div class="story-title">
          <h3>📖 Story ${index + 1} Answers: ${story.title || 'Reading Adventure'}</h3>
        </div>
        
        ${story.whQuestions ? `
          <div class="activity-title">📝 Reading Comprehension Questions</div>
          ${story.whQuestions.map((q: any, i: number) => `
            <div class="question">${i + 1}. ${typeof q === 'string' ? q : q.question}</div>
            <div class="answer-text">💡 Sample Answer: ${typeof q === 'string' ? 'Answers may vary based on story details' : (q.answer || 'Answers may vary - check story for details')}</div>
          `).join('')}
        ` : ''}
        
        ${story.emotionQuiz ? `
          <div class="activity-title">😊 Emotion Recognition</div>
          ${story.emotionQuiz.map((q: any, i: number) => `
            <div class="question">${i + 1}. ${q.question}</div>
            <div class="answer-text">✅ Correct Answer: ${q.correct !== undefined ? String.fromCharCode(65 + q.correct) + ') ' + q.options[q.correct] : 'Check story context'}</div>
          `).join('')}
        ` : ''}
        
        ${story.bmeStory ? `
          <div class="activity-title">📚 Story Structure</div>
          <div class="answer-text">💡 <strong>Beginning:</strong> ${story.bmeStory.beginning || 'Story introduction and setting'}</div>
          <div class="answer-text">💡 <strong>Middle:</strong> ${story.bmeStory.middle || 'Main events and problem'}</div>
          <div class="answer-text">💡 <strong>End:</strong> ${story.bmeStory.end || 'Solution and conclusion'}</div>
        ` : ''}
        
        ${story.threeLineSummary ? `
          <div class="activity-title">📝 Three Line Summary</div>
          <div class="answer-text">💡 <strong>Sample Summary:</strong></div>
          <div class="answer-text">1. ${story.threeLineSummary.line1 || 'First sentence should introduce the main character and setting.'}</div>
          <div class="answer-text">2. ${story.threeLineSummary.line2 || 'Second sentence should describe the main problem or event.'}</div>
          <div class="answer-text">3. ${story.threeLineSummary.line3 || 'Third sentence should explain how it was resolved.'}</div>
        ` : ''}
        
        ${story.sentenceOrder ? `
          <div class="activity-title">🔢 Sentence Ordering</div>
          <div class="answer-text">✅ <strong>Correct Order:</strong></div>
          ${story.sentenceOrder.sentences.map((sentence: string, i: number) => `
            <div class="answer-text">${i + 1}. ${sentence}</div>
          `).join('')}
        ` : ''}
        
        ${story.drawAndTell ? `
          <div class="activity-title">🎨 Draw and Tell</div>
          <div class="answer-text">💡 <strong>Drawing should include:</strong> Details from the story, main characters, setting, or key events mentioned in the prompt.</div>
        ` : ''}
        
      `).join('')}
      
      <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px; text-align: center;">
        <div class="answer-text">🌟 <strong>Great job completing this worksheet!</strong> 🌟</div>
        <div class="answer-text">Remember: Reading comprehension improves with practice. Keep reading and asking questions!</div>
      </div>
    </div>
  `
}
