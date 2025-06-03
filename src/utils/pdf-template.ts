import { StoryData } from '../types/story'

export function generateWorksheetHTML(stories: StoryData[]): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autism Can Read - Worksheet</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: letter;
      margin: 0.75in;
    }
    
    body {
      font-family: 'Comic Sans MS', 'Arial', cursive;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .section-header {
      text-align: center;
      margin: 20px 0 15px 0;
      padding: 10px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #1976d2;
      border: 2px solid #90caf9;
    }
    
    .story-box {
      background: #f8f9fa;
      border: 2px solid #dee2e6;
      border-radius: 10px;
      padding: 20px;
      margin: 15px 0;
      min-height: 120px;
    }
    
    .activity-section {
      margin: 25px 0;
      padding: 15px;
      border-left: 4px solid #4caf50;
      background: #f1f8e9;
    }
    
    .question {
      margin: 15px 0;
      font-weight: 500;
    }
    
    .answer-line {
      border-bottom: 1px solid #999;
      min-height: 25px;
      margin: 8px 0;
      width: 100%;
      display: inline-block;
    }
    
    .answer-lines {
      margin: 10px 0;
    }
    
    .multiple-choice {
      margin: 8px 0;
      padding-left: 20px;
    }
    
    .drawing-box {
      border: 2px solid #666;
      border-radius: 8px;
      height: 200px;
      margin: 15px 0;
      background: #fafafa;
      position: relative;
    }
    
    .drawing-box::before {
      content: "✏️ Draw here";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #999;
      font-size: 16px;
    }
    
    .bme-section {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin: 15px 0;
    }
    
    .bme-item {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: white;
    }
    
    .bme-label {
      font-weight: bold;
      color: #666;
      margin-bottom: 10px;
      font-size: 16px;
    }
    
    .sentence-order {
      margin: 10px 0;
      padding: 10px;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 5px;
    }
    
    .sentence-order::before {
      content: "___";
      margin-right: 10px;
      font-weight: bold;
    }
    
    .answer-key {
      background: #ffe0e0;
      border: 2px solid #ff9999;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .answer-key h2 {
      color: #d32f2f;
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
    }
    
    .answer-text {
      color: #d32f2f;
      font-weight: bold;
      margin: 5px 0;
    }
    
    .story-title {
      background: #e8f5e8;
      padding: 15px;
      border-radius: 10px;
      margin: 15px 0;
      border: 2px solid #4caf50;
    }
    
    .activity-title {
      font-size: 16px;
      font-weight: bold;
      color: #1976d2;
      margin: 15px 0 10px 0;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }
  </style>
</head>
<body>
  ${generateWorksheetContent(stories)}
  ${generateAnswerKey(stories)}
</body>
</html>
  `
}

function generateWorksheetContent(stories: StoryData[]): string {
  return stories.map((story: StoryData, index: number) => `
    ${index > 0 ? '<div class="page-break"></div>' : ''}
    
    <div class="story-title">
      <div class="section-header">📚 Story ${index + 1}: ${story.title || 'Reading Adventure'} 📚</div>
    </div>
    
    <div class="story-box">
      ${story.content || story.story || 'Story content will be displayed here.'}
    </div>
    
    ${story.whQuestions ? `
      <div class="activity-section">
        <div class="activity-title">❓ WH Questions</div>
        ${story.whQuestions.map((q: any, i: number) => `
          <div class="question">${i + 1}. ${typeof q === 'string' ? q : q.question}</div>
          <div class="answer-lines">
            <div class="answer-line"></div>
            <div class="answer-line"></div>
          </div>
        `).join('')}
      </div>
    ` : ''}
    
    ${story.emotionQuiz ? `
      <div class="activity-section">
        <div class="activity-title">😊 Emotion Quiz</div>
        ${story.emotionQuiz.map((q: any, i: number) => `
          <div class="question">${i + 1}. ${q.question}</div>
          ${q.options.map((option: string, j: number) => `
            <div class="multiple-choice">${String.fromCharCode(65 + j)}) ${option}</div>
          `).join('')}
        `).join('')}
      </div>
    ` : ''}
    
    ${story.bmeStory ? `
      <div class="activity-section">
        <div class="activity-title">📝 Story Structure (Beginning, Middle, End)</div>
        <div class="bme-section">
          <div class="bme-item">
            <div class="bme-label">🌅 Beginning:</div>
            <div class="answer-line"></div>
            <div class="answer-line"></div>
            <div class="answer-line"></div>
          </div>
          <div class="bme-item">
            <div class="bme-label">⭐ Middle:</div>
            <div class="answer-line"></div>
            <div class="answer-line"></div>
            <div class="answer-line"></div>
          </div>
          <div class="bme-item">
            <div class="bme-label">🎉 End:</div>
            <div class="answer-line"></div>
            <div class="answer-line"></div>
            <div class="answer-line"></div>
          </div>
        </div>
      </div>
    ` : ''}
    
    ${story.sentenceOrder ? `
      <div class="activity-section">
        <div class="activity-title">🔢 Put in Correct Order</div>
        <p>Number these sentences in the correct order:</p>
        ${story.sentenceOrder.sentences.sort(() => Math.random() - 0.5).map((sentence: string) => `
          <div class="sentence-order">${sentence}</div>
        `).join('')}
      </div>
    ` : ''}
    
    ${story.threeLineSummary ? `
      <div class="activity-section">
        <div class="activity-title">📋 Three Line Summary</div>
        <p>Write a 3-line summary of the story:</p>
        <div class="answer-lines">
          <div>1. <span class="answer-line"></span></div><br>
          <div>2. <span class="answer-line"></span></div><br>
          <div>3. <span class="answer-line"></span></div>
        </div>
      </div>
    ` : ''}
    
    ${story.sentenceCompletion ? `
      <div class="activity-section">
        <div class="activity-title">✏️ Sentence Completion</div>
        ${story.sentenceCompletion.map((item: any, i: number) => `
          <div class="question">${i + 1}. ${item.sentence}</div>
          <div class="answer-line"></div>
          <div class="answer-line"></div>
        `).join('')}
      </div>
    ` : ''}
    
    ${story.drawAndTell ? `
      <div class="activity-section">
        <div class="activity-title">🎨 Draw and Tell</div>
        <p>${story.drawAndTell.prompt}</p>
        <div class="drawing-box"></div>
        ${story.drawAndTell.questions ? story.drawAndTell.questions.map((q: string, i: number) => `
          <div class="question">${i + 1}. ${q}</div>
          <div class="answer-line"></div>
        `).join('') : ''}
      </div>
    ` : ''}
  `).join('')
}

function generateAnswerKey(stories: StoryData[]): string {
  return `
    <div class="page-break"></div>
    
    <div class="answer-key">
      <h2>🔑 ANSWER KEY 🔑</h2>
      
      ${stories.map((story: StoryData, index: number) => `
        <div class="story-title">
          <h3>Story ${index + 1} Answers:</h3>
        </div>
        
        ${story.whQuestions ? `
          <div class="activity-title">❓ WH Questions - Sample Answers</div>
          ${story.whQuestions.map((q: any, i: number) => `
            <div class="question">${i + 1}. ${typeof q === 'string' ? q : q.question}</div>
            <div class="answer-text">Answer: <strong>${typeof q === 'string' ? 'Leo (from story)' : (q.answer || 'Answer from story')}</strong></div>
          `).join('')}
        ` : ''}
        
        ${story.emotionQuiz ? `
          <div class="activity-title">😊 Emotion Quiz Answers</div>
          ${story.emotionQuiz.map((q: any, i: number) => `
            <div class="question">${i + 1}. ${q.question}</div>
            <div class="answer-text">Answer: ${String.fromCharCode(65 + q.correct)}) ${q.options[q.correct]}</div>
          `).join('')}
        ` : ''}
        
        ${story.sentenceOrder ? `
          <div class="activity-title">🔢 Sentence Order - Correct Order</div>
          ${story.sentenceOrder.sentences.map((sentence: string, i: number) => `
            <div class="answer-text">${i + 1}. ${sentence}</div>
          `).join('')}
        ` : ''}
        
        ${story.sentenceCompletion ? `
          <div class="activity-title">✏️ Sentence Completion Answers</div>
          ${story.sentenceCompletion.map((item: any, i: number) => `
            <div class="question">${i + 1}. ${item.sentence}</div>
            ${item.answers && item.answers.length > 0 ? item.answers.map((answer: string, answerIndex: number) => `
              <div class="answer-text"><strong>Blank ${answerIndex + 1}: ${answer}</strong></div>
            `).join('') : `
              <div class="answer-text"><strong>Answer: ${item.answer || item.blank || 'word'}</strong></div>
            `}
          `).join('')}
        ` : ''}
        
        ${story.bmeStory ? `
          <div class="activity-title">📖 BME Story Structure - Sample Answers</div>
          <div class="answer-text"><strong>Beginning:</strong> ${story.bmeStory.beginning}</div>
          <div class="answer-text"><strong>Middle:</strong> ${story.bmeStory.middle}</div>
          <div class="answer-text"><strong>End:</strong> ${story.bmeStory.end}</div>
        ` : ''}
        
        ${story.threeLineSummary ? `
          <div class="activity-title">📋 Three Line Summary - Sample Answer</div>
          <div class="answer-text">1. ${story.threeLineSummary.line1}</div>
          <div class="answer-text">2. ${story.threeLineSummary.line2}</div>
          <div class="answer-text">3. ${story.threeLineSummary.line3}</div>
        ` : ''}
        
        ${story.drawAndTell ? `
          <div class="activity-title">🎨 Draw and Tell - Sample Responses</div>
          <div class="answer-text"><strong>Drawing Prompt:</strong> ${story.drawAndTell.prompt}</div>
          ${story.drawAndTell.questions ? story.drawAndTell.questions.map((q: string, i: number) => `
            <div class="answer-text">${i + 1}. ${q} - <em>(Answers will vary based on child's drawing)</em></div>
          `).join('') : ''}
        ` : ''}
        
        ${!story.bmeStory && !story.threeLineSummary && !story.drawAndTell ? '' : `
          <div class="answer-text" style="margin-top: 15px; font-style: italic; color: #666;">
            📝 Note: For creative activities, encourage children to express their own ideas and interpretations!
          </div>
        `}
        
        <br><br>
      `).join('')}
    </div>
  `
}
