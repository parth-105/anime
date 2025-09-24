export const metadata = {
  title: 'DramaDrift — Watch Movies, Series, Anime Online Free | HD Streaming',
  description: 'Watch the latest movies, TV series, and anime online free in HD quality. Stream thousands of titles with subtitles and multiple audio tracks on DramaDrift.',
  keywords: 'watch movies online, free streaming, HD movies, TV series, anime, DramaDrift, online cinema',
  authors: [{ name: 'DramaDrift Team' }],
  creator: 'DramaDrift',
  publisher: 'DramaDrift',
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
    url: 'https://dramadrift.vercel.app',
    title: 'DramaDrift — Watch Movies, Series, Anime Online Free',
    description: 'Watch the latest movies, TV series, and anime online free in HD quality. Stream thousands of titles with subtitles and multiple audio tracks.',
    siteName: 'DramaDrift',
    images: [
      {
        url: 'https://dramadrift.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'DramaDrift - Watch Movies Online Free',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DramaDrift — Watch Movies, Series, Anime Online Free',
    description: 'Watch the latest movies, TV series, and anime online free in HD quality.',
    images: ['https://dramadrift.vercel.app/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://dramadrift.vercel.app',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#0b61ff' },
      { rel: 'manifest', url: '/site.webmanifest' },
      { rel: 'msapplication-config', url: '/browserconfig.xml' }
    ]
  }
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
              DramaDrift
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
            <p>&copy; 2024 DramaDrift. Watch movies, series, K-dramas, anime and more online free.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}


