'use client'
import React from 'react'
import ContentCard from '@/app/components/ContentCard'

export default function TestAspectRatio() {
  // Test data with different image sources
  const testItems = [
    {
      id: '1',
      title: 'Regular Movie Poster',
      poster: 'https://i.imgur.com/placeholder.jpg', // Regular poster
      year: 2023,
      rating: 8.5,
      type: 'movie',
      genre: ['Action']
    },
    {
      id: '2', 
      title: 'YouTube Thumbnail (16:9)',
      poster: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', // YouTube thumbnail
      year: 2023,
      rating: 9.2,
      type: 'movie',
      genre: ['Music']
    },
    {
      id: '3',
      title: 'Another YouTube Video',
      poster: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg', // Another YouTube thumbnail
      year: 2022,
      rating: 7.8,
      type: 'anime',
      genre: ['Comedy']
    },
    {
      id: '4',
      title: 'Regular Drama Poster',
      poster: 'https://i.imgur.com/placeholder2.jpg', // Regular poster
      year: 2024,
      rating: 8.9,
      type: 'kdrama',
      genre: ['Romance']
    }
  ]

  return (
    <div className="min-h-screen bg-cinemalux">
      <div className="container-xl page-px page-py section-gap">
        <h1 className="text-3xl font-bold mb-8">Aspect Ratio Test Page</h1>
        
        <div className="mb-8 p-6 bg-white/5 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Problem Solved:</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• YouTube thumbnails (16:9) now use <code className="bg-white/10 px-2 py-1 rounded">aspect-[16/9]</code></li>
            <li>• Regular posters use <code className="bg-white/10 px-2 py-1 rounded">aspect-[2/3]</code></li>
            <li>• Images are properly cropped with <code className="bg-white/10 px-2 py-1 rounded">object-cover</code></li>
            <li>• No more gaps or stretching issues</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {testItems.map(item => (
            <ContentCard 
              key={item.id} 
              item={item}
              className="rounded-xl"
            />
          ))}
        </div>

        <div className="mt-12 p-6 bg-white/5 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">How it works:</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <p><strong>Detection:</strong> The component detects YouTube thumbnails by checking if the URL contains <code>i.ytimg.com</code> or <code>img.youtube.com</code></p>
            <p><strong>Aspect Ratio:</strong> YouTube thumbnails get <code>aspect-[16/9]</code>, others get <code>aspect-[2/3]</code></p>
            <p><strong>Image Fitting:</strong> Uses <code>object-cover</code> with <code>object-center</code> for YouTube and <code>object-top</code> for regular posters</p>
            <p><strong>Fallback:</strong> Includes error handling for broken images with a nice fallback UI</p>
          </div>
        </div>
      </div>
    </div>
  )
}
