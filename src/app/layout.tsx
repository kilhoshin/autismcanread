import { Geist, Geist_Mono } from "next/font/google";
import { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutismCanRead - Worksheet Generator for Children with Autism & ADHD",
  description: "Create customized educational worksheets for children with autism spectrum and ADHD. AI-powered story generation with 7 specialized learning activities.",
  keywords: "autism, ADHD, worksheets, education, special needs, learning activities, AI-generated stories",
  authors: [{ name: "AutismCanRead Team" }],
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
