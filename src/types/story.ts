export interface StoryData {
  title: string
  content: string
  story?: string
  whQuestions?: Array<{question: string; answer: string}> | string[]
  emotionQuiz?: Array<{question: string; options: string[]; correct: number}>
  bmeStory?: {beginning: string; middle: string; end: string}
  sentenceOrder?: {sentences: string[]; correctOrder: number[]}
  threeLineSummary?: {line1: string; line2: string; line3: string}
  sentenceCompletion?: Array<{sentence: string; answers: string[]; blanks: string[]}>
  drawAndTell?: {prompt: string; questions: string[]}
}
