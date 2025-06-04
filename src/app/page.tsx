'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Book, Users, Download, Star, CheckCircle, ArrowRight, FileText, Printer, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/utils/supabase'
import { clearAuthAndReload } from '@/utils/clearStorage'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'AutismCanRead - AI-Powered Reading Comprehension Worksheets',
    description: 'Transform your child\'s reading journey with AI-powered, personalized worksheets designed specifically for children with autism and ADHD.',
    brand: {
      '@type': 'Brand',
      name: 'AutismCanRead'
    },
    offers: {
      '@type': 'Offer',
      price: '5.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'RecurringPaymentModel',
        frequency: 'Monthly'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '127'
    },
    features: [
      'AI-powered worksheet generation',
      '7 specialized reading activities',
      'Personalized learning content',
      'Instant PDF downloads',
      'Progress tracking',
      'Autism and ADHD focused',
      'Reading comprehension improvement'
    ]
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does AutismCanRead help children with autism and ADHD?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AutismCanRead uses AI technology to create personalized reading comprehension worksheets tailored to each child\'s reading level and interests, making learning more engaging and effective for children with autism and ADHD.'
        }
      },
      {
        '@type': 'Question',
        name: 'What types of activities are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer 7 core reading comprehension activities: WH Questions, Emotion Quiz, Story Structure, Sentence Order, Summarize, Complete the Sentence, and Picture and Story activities.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does AutismCanRead cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AutismCanRead costs $5 per month and includes unlimited worksheet creation, access to all 7 activities, AI-powered story generation, and high-quality PDF downloads.'
        }
      }
    ]
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                <Book className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AutismCanRead</h1>
                <p className="text-sm text-gray-600">AI-Powered Reading Comprehension Worksheets</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium">
                    About
                  </Link>
                  <Link href="/blog" className="text-gray-600 hover:text-gray-900 font-medium">
                    Blog
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
                  <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium">
                    About
                  </Link>
                  <Link href="/blog" className="text-gray-600 hover:text-gray-900 font-medium">
                    Blog
                  </Link>
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
      <section className="py-20 px-4" role="banner">
        <div className="max-w-6xl mx-auto text-center">
          <header className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <span className="text-gray-900">
                Reading Comprehension Worksheets
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 leading-relaxed font-medium">
              Personalized learning materials designed to improve your child's reading comprehension skills
            </p>
            <p className="text-lg text-gray-500 mb-8">
              Customized • Personalized • AI-Powered • Reading Improvement
            </p>
          </header>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl flex items-center"
              >
                Go to Dashboard
                <ArrowRight className="w-6 h-6 ml-2" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl flex items-center"
                >
                  Get Started for Free 
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Link>
                <Link
                  href="/pricing"
                  className="bg-white border-2 border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center"
                >
                  View Pricing
                </Link>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-blue-100 shadow-lg">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <span>AI-Powered Customization</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-500 mr-2" />
                <span>Parent & Teacher Verified</span>
              </div>
              <div className="flex items-center">
                <Download className="w-5 h-5 text-blue-500 mr-2" />
                <span>Instantly Available</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-purple-500 mr-2" />
                <span>Guaranteed Reading Improvement</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Customization</h3>
              <p className="text-gray-600">
                Our AI technology analyzes your child's reading level and interests to create personalized worksheets
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-purple-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Reading Comprehension Improvement</h3>
              <p className="text-gray-600">
                Our systematic approach helps improve your child's reading comprehension skills in a fun and engaging way
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-green-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Parent & Teacher Friendly</h3>
              <p className="text-gray-600">
                Our intuitive interface makes it easy for parents and teachers to create professional-grade learning materials
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white" role="main" aria-labelledby="how-it-works-heading">
        <div className="max-w-6xl mx-auto px-4">
          <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            🚀 3-Step Process to Create Personalized Worksheets
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Our AI technology makes it easy to create customized learning materials in just a few steps
          </p>
          <div className="grid md:grid-cols-3 gap-8" role="list">
            <article className="text-center group" role="listitem">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Choose a Topic and Activity</h3>
              <p className="text-gray-600 leading-relaxed">Select a topic and activity that aligns with your child's interests and reading level</p>
            </article>
            <article className="text-center group" role="listitem">
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">AI-Powered Worksheet Creation</h3>
              <p className="text-gray-600 leading-relaxed">Our AI technology creates a personalized worksheet based on your child's reading level and interests</p>
            </article>
            <article className="text-center group" role="listitem">
              <div className="bg-gradient-to-r from-green-100 to-green-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Instant Download and Use</h3>
              <p className="text-gray-600 leading-relaxed">Download your worksheet instantly and start using it with your child today</p>
            </article>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="py-16 bg-gray-50" aria-labelledby="activities-heading">
        <div className="max-w-6xl mx-auto px-4">
          <h2 id="activities-heading" className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            🎯 7 Core Reading Comprehension Activities
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Our activities are designed to improve your child's reading comprehension skills in a fun and engaging way
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
            {[
              { icon: '❓', title: 'WH Questions', desc: 'Who, What, When, Where, Why', href: '/activity/wh-questions' },
              { icon: '😊', title: 'Emotion Quiz', desc: 'Identify emotions in a story', href: '/activity/emotion-quiz' },
              { icon: '📖', title: 'Story Structure', desc: 'Understand the beginning, middle, and end of a story', href: '/activity/bme-story' },
              { icon: '🔢', title: 'Sentence Order', desc: 'Put sentences in logical order', href: '/activity/sentence-order' },
              { icon: '📝', title: 'Summarize', desc: 'Summarize the main points of a story', href: '/activity/summarize' },
              { icon: '✏️', title: 'Complete the Sentence', desc: 'Fill in the blanks to complete a sentence', href: '/activity/fill-blanks' },
              { icon: '🎨', title: 'Picture and Story', desc: 'Draw a picture and write a story', href: '/activity/draw-and-tell' },
            ].map((activity, index) => (
              <article key={index} className="bg-white p-6 rounded-xl shadow-md text-center border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all group" role="listitem">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">{activity.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{activity.title}</h3>
                <p className="text-sm text-gray-600">{activity.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white" aria-labelledby="pricing-heading">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">🚀 Get Started Today</h2>
          <p className="text-gray-600 mb-8 text-lg">Improve your child's reading comprehension skills for just $5/month</p>
          <article className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-200 shadow-lg" itemScope itemType="https://schema.org/PriceSpecification">
            <div className="text-5xl mb-4" aria-hidden="true">✨</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Premium Plan</h3>
            <div className="text-5xl font-bold text-blue-600 mb-6">
              <span itemProp="price">$5</span>
              <span className="text-xl text-gray-600" itemProp="billingIncrement">/month</span>
            </div>
            <ul className="text-left space-y-4 mb-8 max-w-md mx-auto">
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">Unlimited Worksheet Creation</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">Access to 7 Core Reading Comprehension Activities</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">Worksheet History Management</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">AI-Powered Story Creation</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">High-Quality PDF Download</span>
              </li>
            </ul>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
                <ArrowRight className="w-6 h-6 ml-2" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Today 🎉
              </Link>
            )}
          </article>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">AutismCanRead</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI-Powered Reading Comprehension Worksheets for children with autism
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">🎯 Core Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• AI-Powered Worksheet Generation</li>
                <li>• 7 Core Reading Comprehension Activities</li>
                <li>• Instant PDF Download</li>
                <li>• Worksheet History Management</li>
                <li>• Personalized Learning Experience</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">📞 Customer Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• Email: kylo.sheen@gmail.com</li>
                <li>• User Guide</li>
                <li>• FAQ</li>
                <li>• Technical Support</li>
              </ul>
              <div className="mt-4">
                <button 
                  onClick={() => clearAuthAndReload()}
                  className="text-gray-400 hover:text-gray-200 transition-colors text-sm block"
                  title="Clear browser cache and resolve login issues"
                >
                  🧹 Clear Cache & Resolve Login Issues
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AutismCanRead. All rights reserved. | AI-Powered Reading Comprehension Worksheets for children with autism</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
