'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Book, Download, Eye, Calendar, FileText, ArrowLeft, Trash2 } from 'lucide-react'

interface WorksheetRecord {
  id: string
  date: string
  topics: string[]
  activities: string[]
  count: number
}

export default function History() {
  const [history, setHistory] = useState<WorksheetRecord[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem('worksheetHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const getTopicLabel = (topicId: string) => {
    const topicMap: { [key: string]: string } = {
      'cooking': 'Cooking',
      'morning': 'Morning Routine',
      'cleaning': 'Cleaning',
      'plants': 'Plant Care',
      'homework': 'Homework',
      'friendship': 'Friendship'
    }
    return topicMap[topicId] || topicId
  }

  const getActivityLabel = (activityId: string) => {
    const activityMap: { [key: string]: string } = {
      'wh-questions': 'WH Questions',
      'emotion-quiz': 'Emotion Quiz',
      'bme-story': 'BME Story',
      'sentence-order': 'Sentence Order',
      'three-line-summary': 'Three Line Summary',
      'sentence-completion': 'Sentence Completion',
      'draw-and-tell': 'Draw and Tell'
    }
    return activityMap[activityId] || activityId
  }

  const handleDeleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this worksheet record?')) {
      const updatedHistory = history.filter(record => record.id !== id)
      setHistory(updatedHistory)
      localStorage.setItem('worksheetHistory', JSON.stringify(updatedHistory))
    }
  }

  const handleRegenerate = async (record: WorksheetRecord) => {
    try {
      const response = await fetch('/api/generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: record.topics,
          activities: record.activities,
          count: record.count,
          readingLevel: 3,
          writingLevel: 2
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `worksheet-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Failed to regenerate worksheet.')
      }
    } catch (error) {
      console.error('Error regenerating worksheet:', error)
      alert('An error occurred while regenerating the worksheet.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-xl">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reading Friends</h1>
                <p className="text-sm text-gray-600">Worksheet History</p>
              </div>
            </Link>
            <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Worksheet Generation
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">📚 Past Worksheet Records</h2>
            <p className="text-gray-600">You can download or regenerate previously created worksheets.</p>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">No worksheets have been created yet.</h3>
              <p className="text-gray-400 mb-6">Create your first worksheet!</p>
              <Link href="/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">
                Create a Worksheet
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="text-gray-600">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">📚 Topics</h4>
                          <div className="space-y-1">
                            {record.topics.map((topic, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-1 mb-1">
                                {getTopicLabel(topic)}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">🎯 Activities</h4>
                          <div className="space-y-1">
                            {record.activities.map((activity, index) => (
                              <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-1 mb-1">
                                {getActivityLabel(activity)}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">📊 Count</h4>
                          <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm font-semibold">
                            {record.count} worksheets
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleRegenerate(record)}
                        className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Regenerate & Download
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                You have {history.length} worksheet records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
