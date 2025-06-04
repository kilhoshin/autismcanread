import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About AutismCanRead - AI-Powered Reading Support for Children',
  description: 'Learn how AutismCanRead uses artificial intelligence to create personalized reading comprehension worksheets for children with autism and ADHD. Our mission is to make reading accessible and enjoyable for every child.',
  keywords: 'autism reading support, ADHD learning tools, AI education, reading comprehension, special needs, inclusive education',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About AutismCanRead
          </h1>
          <p className="text-xl text-gray-600">
            Empowering children with autism and ADHD through AI-powered reading comprehension tools
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              At AutismCanRead, we believe every child deserves access to engaging, personalized learning materials that meet them where they are. Our AI-powered platform creates customized reading comprehension worksheets specifically designed for children with autism spectrum disorders and ADHD.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              We understand that traditional one-size-fits-all educational materials often don't work for children with diverse learning needs. That's why we've developed cutting-edge artificial intelligence technology that adapts to each child's unique interests, reading level, and learning style.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Help</h2>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-blue-600 mb-3">🎯 Personalized Learning</h3>
                <p className="text-gray-700">
                  Our AI analyzes each child's reading level, interests, and learning patterns to create worksheets that are perfectly tailored to their needs.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-purple-600 mb-3">🧠 Evidence-Based Activities</h3>
                <p className="text-gray-700">
                  Our 7 core activities are based on proven reading comprehension strategies and adapted for children with autism and ADHD.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-green-600 mb-3">👨‍👩‍👧‍👦 Family-Friendly</h3>
                <p className="text-gray-700">
                  Parents and teachers can easily create professional-quality materials without needing specialized training or expertise.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-orange-600 mb-3">📈 Measurable Progress</h3>
                <p className="text-gray-700">
                  Track your child's improvement over time with our built-in progress monitoring and worksheet history features.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Science Behind Our Approach</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Our platform is built on decades of research in special education, reading comprehension, and artificial intelligence. We work closely with educators, therapists, and families to ensure our tools are not only effective but also enjoyable to use.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Children with autism and ADHD often benefit from visual learning, structured activities, and content that connects to their specific interests. Our AI technology incorporates these principles into every worksheet it creates, resulting in higher engagement and better learning outcomes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment to Accessibility</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              We're committed to making quality educational resources accessible to all families, regardless of their location or economic situation. Our affordable pricing model ensures that cost isn't a barrier to accessing the tools your child needs to succeed.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              We also prioritize privacy and security, ensuring that your child's data is protected while they learn and grow with our platform.
            </p>
          </section>

          <section className="bg-blue-50 p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Join thousands of families who are already using AutismCanRead to support their children's reading journey. Try our platform today and see the difference personalized learning can make.
            </p>
            <Link 
              href="/register"
              className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial →
            </Link>
          </section>
        </article>
      </main>
    </div>
  )
}
