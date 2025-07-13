import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Reading Tips & Resources | ReadersOnTheSpectrum Blog',
  description: 'Expert tips, research-backed strategies, and resources for supporting children with autism and ADHD in their reading journey. Learn from educators and specialists.',
  keywords: 'autism reading tips, ADHD learning strategies, reading comprehension help, special education resources, inclusive learning',
}

export default function BlogPage() {
  const blogPosts = [
    {
      title: "5 Evidence-Based Strategies for Teaching Reading Comprehension to Children with Autism",
      excerpt: "Discover proven methods that help children with autism spectrum disorders develop stronger reading comprehension skills through structured, visual, and interactive approaches.",
      date: "December 15, 2024",
      readTime: "8 min read",
      slug: "reading-comprehension-autism-strategies",
      category: "Teaching Strategies"
    },
    {
      title: "How AI is Revolutionizing Special Education: A Parent's Guide",
      excerpt: "Learn how artificial intelligence technology is creating new opportunities for personalized learning and how it can benefit your child's educational journey.",
      date: "December 10, 2024",
      readTime: "6 min read",
      slug: "ai-special-education-guide",
      category: "Technology"
    },
    {
      title: "Understanding Reading Challenges in ADHD: Signs, Strategies, and Support",
      excerpt: "Explore the unique reading challenges faced by children with ADHD and discover practical strategies to help them succeed in literacy development.",
      date: "December 5, 2024",
      readTime: "10 min read",
      slug: "adhd-reading-challenges-support",
      category: "ADHD Support"
    },
    {
      title: "Creating Engaging Reading Environments for Children with Special Needs",
      excerpt: "Transform your home or classroom into a reading-friendly space that motivates and supports children with autism and ADHD in their literacy journey.",
      date: "November 28, 2024",
      readTime: "7 min read",
      slug: "engaging-reading-environments",
      category: "Learning Environment"
    },
    {
      title: "The Power of Visual Learning: Using Images to Enhance Reading Comprehension",
      excerpt: "Discover how visual supports and graphic organizers can significantly improve reading comprehension for children with autism and ADHD.",
      date: "November 20, 2024",
      readTime: "5 min read",
      slug: "visual-learning-reading-comprehension",
      category: "Visual Learning"
    },
    {
      title: "Building Reading Confidence: Celebrating Small Wins in Special Education",
      excerpt: "Learn how to recognize progress, celebrate achievements, and build lasting reading confidence in children with diverse learning needs.",
      date: "November 15, 2024",
      readTime: "6 min read",
      slug: "building-reading-confidence",
      category: "Motivation"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Reading Tips & Resources
          </h1>
          <p className="text-xl text-gray-600">
            Expert guidance for supporting children with autism and ADHD in their reading journey
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Featured Post */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl">
              <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-4">
                Featured Article
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {blogPosts[0].title}
              </h2>
              <p className="text-blue-100 text-lg mb-6">
                {blogPosts[0].excerpt}
              </p>
              <div className="flex items-center space-x-4 text-blue-100 mb-6">
                <span>{blogPosts[0].date}</span>
                <span>•</span>
                <span>{blogPosts[0].readTime}</span>
              </div>
              <Link 
                href={`/blog/${blogPosts[0].slug}`}
                className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Read Article →
              </Link>
            </div>
          </div>
        </section>

        {/* Blog Grid */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post, index) => (
              <article key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-sm">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">{post.date}</span>
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="mt-16 bg-white rounded-2xl p-8 shadow-md">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated with Our Latest Tips
            </h2>
            <p className="text-gray-600 mb-6">
              Get research-backed strategies and resources delivered to your inbox monthly. No spam, just valuable content for supporting your child's reading journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
