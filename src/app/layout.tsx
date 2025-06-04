import { Geist, Geist_Mono } from "next/font/google";
import { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import React from "react";
import Analytics from "@/components/Analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | AutismCanRead',
    default: 'AutismCanRead - AI-Powered Reading Comprehension Worksheets for Children with Autism & ADHD'
  },
  description: "Transform your child's reading journey with AI-powered, personalized worksheets designed specifically for children with autism and ADHD. Create engaging reading comprehension activities instantly with our 7 specialized learning tools.",
  keywords: [
    "autism worksheets",
    "ADHD reading comprehension", 
    "AI-powered education",
    "special needs learning",
    "personalized worksheets",
    "reading comprehension activities",
    "autism spectrum disorder",
    "educational technology",
    "learning disabilities support",
    "individualized education",
    "adaptive learning tools",
    "inclusive education resources"
  ],
  authors: [{ name: "AutismCanRead Team", url: "https://www.autismcanread.com" }],
  creator: "AutismCanRead",
  publisher: "AutismCanRead",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.autismcanread.com/',
    siteName: 'AutismCanRead',
    title: 'AutismCanRead - AI-Powered Reading Comprehension Worksheets',
    description: 'Transform your child\'s reading journey with AI-powered, personalized worksheets for children with autism and ADHD.',
    images: [
      {
        url: 'https://www.autismcanread.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutismCanRead - AI-Powered Reading Comprehension Worksheets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutismCanRead - AI-Powered Reading Comprehension Worksheets',
    description: 'Transform your child\'s reading journey with AI-powered, personalized worksheets for children with autism and ADHD.',
    images: ['https://www.autismcanread.com/og-image.png'],
    creator: '@autismcanread',
  },
  alternates: {
    canonical: 'https://www.autismcanread.com/',
  },
  category: 'Education',
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "AutismCanRead",
              "description": "AI-powered reading comprehension worksheets for children with autism and ADHD",
              "url": "https://www.autismcanread.com/",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "5.00",
                "priceCurrency": "USD",
                "priceSpecification": {
                  "@type": "RecurringPaymentModel",
                  "frequency": "Monthly"
                }
              },
              "creator": {
                "@type": "Organization",
                "name": "AutismCanRead",
                "url": "https://www.autismcanread.com/"
              },
              "featureList": [
                "AI-powered worksheet generation",
                "7 specialized reading activities",
                "Personalized learning content",
                "Instant PDF downloads",
                "Progress tracking"
              ]
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
