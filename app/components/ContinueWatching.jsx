'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import watchHistoryService from '@/lib/watchHistoryService'
import ContentCard from './ContentCard'

export default function ContinueWatching() {
  const [continueWatching, setContinueWatching] = React.useState([])
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    const history = watchHistoryService.getContinueWatching()
    setContinueWatching(history)
  }, [])

  const handleRemove = (contentId, season, episode) => {
    watchHistoryService.markCompleted(contentId, season, episode)
    const updatedHistory = watchHistoryService.getContinueWatching()
    setContinueWatching(updatedHistory)
  }

  if (continueWatching.length === 0 || !isVisible) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">▶️</span>
          Continue Watching
        </h2>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-sm"
        >
          Hide
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {continueWatching.map((item, index) => (
          <div key={`${item.contentId}-${item.season}-${item.episode}`} className="group relative">
            <ContentCard
              item={{
                ...item,
                id: item.contentId,
                progressPercentage: item.progressPercentage
              }}
              href={item.type === 'movie' 
                ? `/watch/movie/${item.contentId}/0/0?t=${Math.round(item.currentTime)}`
                : `/watch/${item.type}/${item.contentId}/${item.season}/${item.episode}?t=${Math.round(item.currentTime)}`
              }
              variant="no-link"
              className="rounded-lg"
            />
            
            {/* Additional Continue Watching specific content */}
            <div className="mt-2">
              <div className="text-xs text-gray-400 mt-1">
                {item.type === 'movie' ? 'Movie' : `S${item.season} E${item.episode}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(item.currentTime)} / {formatTime(item.duration)}
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                handleRemove(item.contentId, item.season, item.episode)
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove from Continue Watching"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
