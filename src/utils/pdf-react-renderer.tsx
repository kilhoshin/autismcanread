import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { StoryData } from '@/types/story'

// Register fonts (optional - using built-in fonts for now)
// Font.register({
//   family: 'Open Sans',
//   src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0bf8pkAg.woff2'
// })

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 30,
    textAlign: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    backgroundColor: '#EBF4FF',
    padding: 8,
    marginBottom: 12
  },
  storyContent: {
    fontSize: 14,
    lineHeight: 1.8,
    textAlign: 'justify',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    border: '1pt solid #E2E8F0'
  },
  question: {
    marginBottom: 15
  },
  questionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5
  },
  answerLines: {
    borderBottom: '1pt solid #CBD5E1',
    height: 20,
    marginBottom: 5
  },
  activitySection: {
    marginBottom: 20
  },
  instruction: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 10
  },
  completionSentence: {
    fontSize: 12,
    marginBottom: 8
  },
  blank: {
    borderBottom: '1pt solid #374151',
    minWidth: 80,
    height: 15
  },
  encouragement: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#DCFCE7',
    textAlign: 'center',
    fontSize: 14,
    color: '#166534',
    fontWeight: 'bold'
  },
  answerItem: {
    marginBottom: 10
  },
  answerText: {
    fontSize: 12,
    color: '#2563EB'
  },
  bmeAnswer: {
    marginBottom: 10
  },
  bmeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5
  }
})

interface WorksheetPDFProps {
  stories: StoryData[]
  activities: string[]
}

const WorksheetPDF: React.FC<WorksheetPDFProps> = ({ stories, activities }) => {
  // Debug logging
  console.log('=== PDF RENDERER DEBUG ===')
  console.log('Received stories:', stories.length)
  console.log('Received activities:', activities)
  
  if (stories.length > 0) {
    const story = stories[0]
    console.log('Story data check:')
    console.log('- title:', story.title)
    console.log('- content length:', story.content?.length || 0)
    console.log('- whQuestions:', story.whQuestions)
    console.log('- emotionQuiz:', story.emotionQuiz)
    console.log('- sentenceOrder:', story.sentenceOrder)
    console.log('- bmeStory:', story.bmeStory)
    console.log('- sentenceCompletion:', story.sentenceCompletion)
    console.log('- threeLineSummary:', story.threeLineSummary)
    console.log('- drawAndTell:', story.drawAndTell)
    
    // Activity matching debug
    console.log('Activity matching check:')
    activities.forEach(activity => {
      console.log(`- Looking for activity: "${activity}"`)
      switch(activity.toLowerCase()) {
        case 'whquestions':
        case 'wh questions':
        case 'wh-questions':
          console.log('  -> Matched WH Questions')
          break
        case 'emotionquiz':
        case 'emotion quiz':
        case 'emotion-quiz':
          console.log('  -> Matched Emotion Quiz')
          break
        case 'sentenceorder':
        case 'sentence order':
        case 'sentence-order':
          console.log('  -> Matched Sentence Order')
          break
        case 'bmestory':
        case 'bme story':
        case 'bme-story':
        case 'bme story structure':
          console.log('  -> Matched BME Story')
          break
        case 'sentencecompletion':
        case 'sentence completion':
        case 'sentence-completion':
          console.log('  -> Matched Sentence Completion')
          break
        case 'threelinesummary':
        case 'three line summary':
        case 'three-line-summary':
          console.log('  -> Matched Three Line Summary')
          break
        case 'drawandtell':
        case 'draw and tell':
        case 'draw-and-tell':
          console.log('  -> Matched Draw and Tell')
          break
        default:
          console.log('  -> NO MATCH FOUND!')
      }
    })
  }
  console.log('=== END PDF RENDERER DEBUG ===')

  return (
    <Document>
      {stories.map((story, storyIndex) => {
        // Helper function to check if any activity is selected and has data - with flexible matching
        const hasActivity = (activityName: string, dataCheck: any) => {
          const normalizedActivityName = activityName.toLowerCase().replace(/[^a-z]/g, '')
          const hasMatchingActivity = activities.some(activity => {
            const normalizedActivity = activity.toLowerCase().replace(/[^a-z]/g, '')
            return normalizedActivity === normalizedActivityName || 
                   normalizedActivity.includes(normalizedActivityName) ||
                   normalizedActivityName.includes(normalizedActivity)
          })
          
          console.log(`hasActivity check: "${activityName}" -> normalized: "${normalizedActivityName}" -> found: ${hasMatchingActivity} -> has data: ${!!dataCheck}`)
          
          return hasMatchingActivity && dataCheck
        }

        // Group activities into pages to avoid empty pages
        const page1Activities = [
          hasActivity('WH Questions', story.whQuestions && story.whQuestions.length > 0)
        ].some(Boolean)

        const page2Activities = [
          hasActivity('Sentence Order', story.sentenceOrder),
          hasActivity('Emotion Quiz', story.emotionQuiz && story.emotionQuiz.length > 0),
          hasActivity('BME Story Structure', story.bmeStory)
        ].some(Boolean)

        const page3Activities = [
          hasActivity('Sentence Completion', story.sentenceCompletion?.length > 0),
          hasActivity('Three Line Summary', story.threeLineSummary),
          hasActivity('Draw and Tell', story.drawAndTell)
        ].some(Boolean)

        return (
          <React.Fragment key={storyIndex}>
            {/* Page 1 - Always show story content + WH Questions if selected */}
            <Page size="LETTER" style={styles.page}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Reading Comprehension Worksheet</Text>
                <Text style={styles.subtitle}>{story.title || `Story ${storyIndex + 1}`}</Text>
              </View>

              {/* Story Content - Always show */}
              {story.content && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Story</Text>
                  <Text style={styles.storyContent}>{story.content}</Text>
                </View>
              )}

              {/* WH Questions */}
              {hasActivity('WH Questions', story.whQuestions && story.whQuestions.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Questions</Text>
                  <Text style={styles.instruction}>Read the story carefully and answer these questions.</Text>
                  {story.whQuestions?.map((q, qIndex) => (
                    <View key={qIndex} style={styles.question}>
                      <Text style={styles.questionText}>
                        {qIndex + 1}. {typeof q === 'string' ? q : q.question}
                      </Text>
                      <View style={styles.answerLines} />
                      <View style={styles.answerLines} />
                    </View>
                  ))}
                </View>
              )}
            </Page>

            {/* Page 2 - Only render if there are activities for this page */}
            {page2Activities && (
              <Page size="LETTER" style={styles.page}>
                {/* Sentence Order */}
                {hasActivity('Sentence Order', story.sentenceOrder) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Put the Sentences in Order</Text>
                    <Text style={styles.instruction}>Read the sentences and number them in the correct order (1, 2, 3...).</Text>
                    {story.sentenceOrder?.sentences?.map((sentence, sIndex) => (
                      <View key={sIndex} style={styles.question}>
                        <Text style={styles.questionText}>
                          _____ {sentence}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Emotion Quiz */}
                {hasActivity('Emotion Quiz', story.emotionQuiz && story.emotionQuiz.length > 0) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Emotion Quiz</Text>
                    <Text style={styles.instruction}>Circle the best answer for each question.</Text>
                    {story.emotionQuiz?.map((eq, eqIndex) => (
                      <View key={eqIndex} style={styles.question}>
                        <Text style={styles.questionText}>
                          {eqIndex + 1}. {eq.question}
                        </Text>
                        {eq.options?.map((option, optIndex) => (
                          <Text key={optIndex} style={{ fontSize: 11, marginLeft: 15, marginBottom: 3 }}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </Text>
                        ))}
                        <View style={{ height: 10 }} />
                      </View>
                    ))}
                  </View>
                )}

                {/* BME Story Structure */}
                {hasActivity('BME Story Structure', story.bmeStory) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Story Structure</Text>
                    <Text style={styles.instruction}>Organize the story into Beginning, Middle, and End.</Text>
                    
                    <View style={styles.question}>
                      <Text style={styles.questionText}>Beginning:</Text>
                      <View style={styles.answerLines} />
                      <View style={styles.answerLines} />
                    </View>
                    
                    <View style={styles.question}>
                      <Text style={styles.questionText}>Middle:</Text>
                      <View style={styles.answerLines} />
                      <View style={styles.answerLines} />
                    </View>
                    
                    <View style={styles.question}>
                      <Text style={styles.questionText}>End:</Text>
                      <View style={styles.answerLines} />
                      <View style={styles.answerLines} />
                    </View>
                  </View>
                )}
              </Page>
            )}

            {/* Page 3 - Only render if there are activities for this page */}
            {page3Activities && (
              <Page size="LETTER" style={styles.page}>
                {/* Sentence Completion */}
                {hasActivity('Sentence Completion', story.sentenceCompletion?.length > 0) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Complete the Sentences</Text>
                    <Text style={styles.instruction}>Fill in the blanks with words from the story.</Text>
                    {story.sentenceCompletion?.map((sc, scIndex) => (
                      <View key={scIndex} style={styles.question}>
                        <Text style={styles.completionSentence}>
                          {scIndex + 1}. {sc.sentence}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Three Line Summary */}
                {hasActivity('Three Line Summary', story.threeLineSummary) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Three Line Summary</Text>
                    <Text style={styles.instruction}>Write a summary of the story in exactly three sentences.</Text>
                    
                    <View style={styles.question}>
                      <Text style={styles.questionText}>1. First sentence:</Text>
                      <View style={styles.answerLines} />
                      <View style={styles.answerLines} />
                    </View>
                    
                    <View style={styles.question}>
                      <Text style={styles.questionText}>2. Second sentence:</Text>
                      <View style={styles.answerLines} />
                      <View style={styles.answerLines} />
                    </View>
                    
                    <View style={styles.question}>
                      <Text style={styles.questionText}>3. Third sentence:</Text>
                      <View style={styles.answerLines} />
                      <View style={styles.answerLines} />
                    </View>
                  </View>
                )}

                {/* Draw and Tell */}
                {hasActivity('Draw and Tell', story.drawAndTell) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Draw and Tell</Text>
                    <Text style={styles.instruction}>{story.drawAndTell?.prompt}</Text>
                    
                    {/* Drawing Space */}
                    <View style={{
                      height: 120,
                      border: '1pt solid #CBD5E1',
                      marginBottom: 15
                    }} />
                    
                    {story.drawAndTell?.questions?.map((question, qIndex) => (
                      <View key={qIndex} style={styles.question}>
                        <Text style={styles.questionText}>{question}</Text>
                        <View style={styles.answerLines} />
                      </View>
                    ))}
                  </View>
                )}

                {/* Encouragement */}
                <View style={styles.encouragement}>
                  <Text> Great job! Keep practicing your reading skills! </Text>
                </View>
              </Page>
            )}

            {/* Answer Key Page */}
            <Page size="LETTER" style={styles.page}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Answer Key</Text>
                <Text style={styles.subtitle}>{story.title || `Story ${storyIndex + 1}`}</Text>
              </View>

              {/* WH Questions Answers */}
              {hasActivity('WH Questions', story.whQuestions && story.whQuestions.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Questions - Answers</Text>
                  {story.whQuestions?.map((q, qIndex) => (
                    <View key={qIndex} style={styles.answerItem}>
                      <Text style={styles.questionText}>{qIndex + 1}. {typeof q === 'string' ? q : q.question}</Text>
                      <Text style={styles.answerText}>Answer: {typeof q === 'string' ? 'Check story for details' : q.answer}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sentence Order Answers */}
              {hasActivity('Sentence Order', story.sentenceOrder) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Sentence Order - Answer</Text>
                  <Text style={styles.instruction}>Correct order:</Text>
                  {(() => {
                    console.log('🔍 Sentence Order Debug:')
                    console.log('- sentenceOrder object:', story.sentenceOrder)
                    console.log('- sentences:', story.sentenceOrder?.sentences)
                    console.log('- correctOrder:', story.sentenceOrder?.correctOrder)
                    
                    if (!story.sentenceOrder?.sentences || !story.sentenceOrder?.correctOrder) {
                      return <Text style={styles.answerText}>No sentence order data available</Text>
                    }
                    
                    // Try different interpretations of correctOrder
                    const sentences = story.sentenceOrder.sentences
                    const correctOrder = story.sentenceOrder.correctOrder
                    
                    // If correctOrder contains indices (0-based or 1-based)
                    if (correctOrder.every(num => typeof num === 'number')) {
                      console.log('- Treating correctOrder as indices')
                      return correctOrder.map((position, index) => {
                        // Handle 1-based indices by subtracting 1
                        const sentenceIndex = typeof position === 'number' ? position - 1 : position
                        const sentence = sentences[sentenceIndex]
                        
                        console.log(`- Position ${index + 1}: correctOrder[${index}]=${position} -> sentenceIndex=${sentenceIndex} -> "${sentence}"`)
                        
                        if (!sentence) {
                          return (
                            <Text key={index} style={styles.answerText}>{index + 1}. [Sentence not found]</Text>
                          )
                        }
                        
                        return (
                          <Text key={index} style={styles.answerText}>{index + 1}. {sentence}</Text>
                        )
                      })
                    } else {
                      // If correctOrder contains actual sentences
                      console.log('- Treating correctOrder as actual sentences')
                      return correctOrder.map((sentence, index) => (
                        <Text key={index} style={styles.answerText}>{index + 1}. {sentence}</Text>
                      ))
                    }
                  })()}
                </View>
              )}

              {/* Emotion Quiz Answers */}
              {hasActivity('Emotion Quiz', story.emotionQuiz && story.emotionQuiz.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Emotion Quiz - Answers</Text>
                  {story.emotionQuiz?.map((q, qIndex) => (
                    <View key={qIndex} style={styles.answerItem}>
                      <Text style={styles.questionText}>{qIndex + 1}. {q.question}</Text>
                      <Text style={styles.answerText}>Answer: {q.options?.[q.correct]}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* BME Story Structure Answers */}
              {hasActivity('BME Story Structure', story.bmeStory) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Story Structure - Sample Answers</Text>
                  <View style={styles.bmeAnswer}>
                    <Text style={styles.bmeLabel}>Beginning:</Text>
                    <Text style={styles.answerText}>{story.bmeStory?.beginning}</Text>
                  </View>
                  <View style={styles.bmeAnswer}>
                    <Text style={styles.bmeLabel}>Middle:</Text>
                    <Text style={styles.answerText}>{story.bmeStory?.middle}</Text>
                  </View>
                  <View style={styles.bmeAnswer}>
                    <Text style={styles.bmeLabel}>End:</Text>
                    <Text style={styles.answerText}>{story.bmeStory?.end}</Text>
                  </View>
                </View>
              )}

              {/* Sentence Completion Answers */}
              {hasActivity('Sentence Completion', story.sentenceCompletion?.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Sentence Completion - Answers</Text>
                  {story.sentenceCompletion?.map((item, index) => (
                    <View key={index} style={styles.answerItem}>
                      <Text style={styles.questionText}>{index + 1}. {item.sentence}</Text>
                      <Text style={styles.answerText}>Answer: {(item as any).answer || (item as any).answers?.join(', ') || 'No answer'}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Three Line Summary Answer */}
              {hasActivity('Three Line Summary', story.threeLineSummary) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Three Line Summary - Sample Answer</Text>
                  {(story.threeLineSummary as any)?.lines ? (
                    (story.threeLineSummary as any).lines.map((line: string, index: number) => (
                      <Text key={index} style={styles.answerText}>{index + 1}. {line}</Text>
                    ))
                  ) : (
                    typeof story.threeLineSummary === 'string' ? (
                      <Text style={styles.answerText}>{story.threeLineSummary}</Text>
                    ) : null
                  )}
                </View>
              )}

              {/* Draw and Tell - No answers needed as it's creative */}
              {hasActivity('Draw and Tell', story.drawAndTell) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Draw and Tell</Text>
                  <Text style={styles.answerText}>This is a creative activity - encourage personal expression!</Text>
                </View>
              )}
            </Page>
          </React.Fragment>
        )
      })}
    </Document>
  )
}

export default WorksheetPDF
