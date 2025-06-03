'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Book, Users, Download, Star, CheckCircle, ArrowRight, FileText, Printer, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/utils/supabase'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b-4 border-blue-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AutismCanRead</h1>
                <p className="text-sm text-gray-600">Worksheet Generator for Children with Autism & ADHD</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                    Pricing
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center"
                  >
                    <div className="flex items-center">
                      <LogOut className="w-5 h-5 mr-2" />
                      Sign Out
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                    Pricing
                  </Link>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                    Login
                  </Link>
                  <Link href="/register" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Customized Worksheets for Children with Autism & ADHD
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create personalized learning materials with our AI-powered worksheet generator
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-white border-2 border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="bg-white border-2 border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center"
              >
                Sign Up Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-blue-100">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customized Creation</h3>
              <p className="text-gray-600">
                Our AI generates worksheets tailored to your child's reading level and interests
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-purple-100">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Download</h3>
              <p className="text-gray-600">
                Download your worksheets as PDFs and print them out for immediate use
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-green-100">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">For Parents & Teachers</h3>
              <p className="text-gray-600">
                Our intuitive interface makes it easy for you to create and manage worksheets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            🔧 3 Easy Steps to Create Your Worksheets
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Choose Your Topic & Activity</h3>
              <p className="text-gray-600">Select from our library of topics and activities to create your worksheet</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Creation</h3>
              <p className="text-gray-600">Our AI generates a customized worksheet based on your selections</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Download Your Worksheet</h3>
              <p className="text-gray-600">Download your worksheet as a PDF and print it out for immediate use</p>
            </div>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            📚 Our Learning Activities
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '❓', title: 'WH Questions', desc: 'Who, What, When, Where, Why' },
              { icon: '😊', title: 'Emotion Quiz', desc: 'Identify emotions in stories' },
              { icon: '📖', title: 'BME Story', desc: 'Beginning, Middle, End story structure' },
              { icon: '🔢', title: 'Sentence Order', desc: 'Put sentences in logical order' },
              { icon: '📝', title: 'Summary', desc: 'Summarize the main points' },
              { icon: '✏️', title: 'Sentence Completion', desc: 'Fill in the blanks' },
              { icon: '🎨', title: 'Picture and Story', desc: 'Draw a picture and write a story' },
            ].map((activity, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center border-2 border-gray-100 hover:border-blue-300 transition-colors">
                <div className="text-3xl mb-3">{activity.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{activity.title}</h3>
                <p className="text-sm text-gray-600">{activity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">💰 Simple Pricing</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-200">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Plan</h3>
            <div className="text-4xl font-bold text-blue-600 mb-4">$5/month</div>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span>Unlimited worksheet creation</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span>Access to all 7 learning activities</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span>Worksheet history management</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span>Customized AI-generated stories</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span>High-quality PDF downloads</span>
              </li>
            </ul>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-white border-2 border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 px-8 py-3 rounded-lg font-bold text-lg transition-all flex items-center"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors"
              >
                Sign Up Now
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">AutismCanRead</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                A worksheet generator for children with autism and ADHD
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Key Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Customized AI-generated stories</li>
                <li>• 7 learning activities</li>
                <li>• Instant PDF downloads</li>
                <li>• Worksheet history management</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Email: support@autismcanread.com</li>
                <li>• User Guide</li>
                <li>• FAQ</li>
                <li>• Technical Support</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AutismCanRead. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
