export const metadata = {
  title: 'NeonFlix — Watch Movies, Series, Anime Online Free | HD Streaming',
  description: 'Watch the latest movies, TV series, and anime online free in HD quality. Stream thousands of titles with subtitles and multiple audio tracks on NeonFlix.',
  keywords: 'watch movies online, free streaming, HD movies, TV series, anime, NeonFlix, online cinema',
  authors: [{ name: 'NeonFlix Team' }],
  creator: 'NeonFlix',
  publisher: 'NeonFlix',
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
    url: 'https://neonflix.com',
    title: 'NeonFlix — Watch Movies, Series, Anime Online Free',
    description: 'Watch the latest movies, TV series, and anime online free in HD quality. Stream thousands of titles with subtitles and multiple audio tracks.',
    siteName: 'NeonFlix',
    images: [
      {
        url: 'https://neonflix.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NeonFlix - Watch Movies Online Free',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeonFlix — Watch Movies, Series, Anime Online Free',
    description: 'Watch the latest movies, TV series, and anime online free in HD quality.',
    images: ['https://neonflix.com/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://neonflix.com',
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

import './globals.css'
import Link from 'next/link'
import AnalyticsClient from '@/app/components/AnalyticsClient'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { contentTypes } from './data/movies'

export default function RootLayout({ children, modal }){
  return (
    <html lang="en">
      <body className="bg-cinemalux">
        <header className="sticky top-0 z-50 glass-panel border-b-0">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl neon-title font-bold hover:text-blue-400 transition-colors">
              NeonFlix
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              {Object.entries(contentTypes).slice(0, 6).map(([key, type]) => (
                <Link 
                  key={key} 
                  href={`/category/${key}`}
                  className="flex items-center gap-1 text-sm hover:text-blue-400 transition-colors"
                >
                  <span>{type.icon}</span>
                  <span className="hidden lg:inline">{type.name}</span>
                </Link>
              ))}
            </nav>
            
            {/* Mobile Menu Button */}
            <button className="md:hidden text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </header>
        
        <main className="min-h-screen">
          <AnalyticsClient />
          {children}
          {modal}
        </main>
        <VercelAnalytics />
        
        <footer className="glass-panel py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
            <p>&copy; 2024 NeonFlix. Watch movies, series, K-dramas, anime and more online free.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}


