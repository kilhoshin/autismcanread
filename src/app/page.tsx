'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Book, Users, Download, Star, CheckCircle, ArrowRight, FileText, Printer, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/utils/supabase'
import { clearAuthAndReload } from '@/utils/clearStorage'

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
                <p className="text-sm text-gray-600">AI-Powered Reading Comprehension Worksheets</p>
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
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI와 함께 만드는
              </span>
              <br />
              <span className="text-gray-900">
                맞춤형 읽기 이해 워크시트
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-4 leading-relaxed font-medium">
              우리 아이만을 위한 개인화된 학습 자료를 AI가 자동으로 생성해드립니다
            </p>
            <p className="text-lg text-gray-500 mb-8">
              ✨ 맞춤형 • 🎯 개인화 • 🤖 AI 기반 • 📚 읽기 능력 향상
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl flex items-center"
              >
                대시보드로 이동
                <ArrowRight className="w-6 h-6 ml-2" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl flex items-center"
                >
                  무료로 시작하기 🎉
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Link>
                <Link
                  href="/pricing"
                  className="bg-white border-2 border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center"
                >
                  요금제 보기
                </Link>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-blue-100 shadow-lg">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                <span>AI 기반 맞춤형 생성</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-green-500 mr-2" />
                <span>부모 & 교사 검증</span>
              </div>
              <div className="flex items-center">
                <Download className="w-5 h-5 text-blue-500 mr-2" />
                <span>즉시 사용 가능</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-purple-500 mr-2" />
                <span>읽기 능력 향상 보장</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-blue-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI 맞춤형 생성</h3>
              <p className="text-gray-600">
                아이의 읽기 수준과 관심사를 분석해 최적화된 워크시트를 자동 생성합니다
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-purple-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">읽기 이해력 향상</h3>
              <p className="text-gray-600">
                체계적인 문제 구성으로 아이의 읽기 이해 능력을 단계적으로 향상시킵니다
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-green-100 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">부모 & 교사 친화적</h3>
              <p className="text-gray-600">
                간편한 인터페이스로 누구나 쉽게 전문적인 학습 자료를 만들 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            🚀 3단계로 쉽게 만드는 맞춤형 워크시트
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            AI가 도와주는 간단한 과정으로 우리 아이만의 특별한 학습 자료를 만들어보세요
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-r from-blue-100 to-blue-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">주제와 활동 선택</h3>
              <p className="text-gray-600 leading-relaxed">아이가 좋아하는 주제를 선택하고 원하는 학습 활동 유형을 고르세요</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">AI 자동 생성</h3>
              <p className="text-gray-600 leading-relaxed">똑똑한 AI가 아이의 수준에 맞춰 개인화된 워크시트를 자동으로 만들어드려요</p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-r from-green-100 to-green-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">즉시 다운로드 & 사용</h3>
              <p className="text-gray-600 leading-relaxed">PDF로 다운로드해서 바로 인쇄하여 사용하거나 태블릿에서 바로 활용하세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            🎯 다양한 읽기 이해 활동
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            아이의 읽기 능력을 종합적으로 향상시키는 7가지 핵심 활동들
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '❓', title: 'WH 질문', desc: '누가, 무엇을, 언제, 어디서, 왜' },
              { icon: '😊', title: '감정 퀴즈', desc: '이야기 속 감정 이해하기' },
              { icon: '📖', title: '이야기 구조', desc: '시작-중간-끝 파악하기' },
              { icon: '🔢', title: '문장 순서', desc: '논리적 순서로 배열하기' },
              { icon: '📝', title: '요약하기', desc: '핵심 내용 정리하기' },
              { icon: '✏️', title: '문장 완성', desc: '빈칸 채우며 이해하기' },
              { icon: '🎨', title: '그림과 이야기', desc: '그림 그리고 이야기 쓰기' },
            ].map((activity, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{activity.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{activity.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{activity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">🚀 지금 시작해보세요</h2>
          <p className="text-gray-600 mb-8 text-lg">월 단 5달러로 우리 아이의 읽기 능력을 향상시켜보세요</p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-blue-200 shadow-lg">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">프리미엄 플랜</h3>
            <div className="text-5xl font-bold text-blue-600 mb-6">$5<span className="text-xl text-gray-600">/월</span></div>
            <ul className="text-left space-y-4 mb-8 max-w-md mx-auto">
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">무제한 워크시트 생성</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">7가지 모든 학습 활동 이용</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">워크시트 히스토리 관리</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">AI 맞춤형 이야기 생성</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-lg">고화질 PDF 다운로드</span>
              </li>
            </ul>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl"
              >
                대시보드로 이동
                <ArrowRight className="w-6 h-6 ml-2" />
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:shadow-xl"
              >
                지금 시작하기 🎉
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
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Book className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">AutismCanRead</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                AI와 함께 만드는 맞춤형 읽기 이해 워크시트로 우리 아이의 학습 능력을 향상시켜보세요
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">🎯 핵심 기능</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• AI 맞춤형 이야기 생성</li>
                <li>• 7가지 읽기 이해 활동</li>
                <li>• 즉시 PDF 다운로드</li>
                <li>• 워크시트 히스토리 관리</li>
                <li>• 개인화된 학습 경험</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">📞 고객 지원</h3>
              <ul className="space-y-2 text-gray-400">
                <li>• 이메일: support@autismcanread.com</li>
                <li>• 사용자 가이드</li>
                <li>• 자주 묻는 질문</li>
                <li>• 기술 지원</li>
              </ul>
              <div className="mt-4">
                <button 
                  onClick={() => clearAuthAndReload()}
                  className="text-gray-400 hover:text-gray-200 transition-colors text-sm block"
                  title="브라우저 캐시 삭제 및 로그인 문제 해결"
                >
                  🧹 캐시 삭제 & 로그인 문제 해결
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AutismCanRead. All rights reserved. | 우리 아이의 읽기 능력 향상을 위한 AI 학습 도구</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
