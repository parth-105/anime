'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ContentCard({ 
  item, 
  variant = 'default',
  showRating = true,
  showYear = true,
  showPlayButton = true,
  className = '',
  href
}) {
  // Determine if this is a YouTube thumbnail (16:9 aspect ratio)
  const isYouTubeThumbnail = item.poster?.includes('i.ytimg.com') || item.poster?.includes('img.youtube.com')
  
  // Use different aspect ratios based on content source
  const aspectRatio = isYouTubeThumbnail ? 'aspect-[16/9]' : 'aspect-[2/3]'
  
  // Use provided href or generate fallback (ensure clean URLs)
  const cardHref = href || (item.type === 'movie' 
    ? `/watch/movie/${item.id}/0/0` 
    : `/watch/${item.type}/${item.id}/1/${item.seasons?.[0]?.episodes?.[0]?.id}`
  )
  
  // Ensure the href is clean (no query parameters)
  const cleanHref = cardHref.split('?')[0]

  const cardContent = (
    <div className={`group relative card-hover ${className}`}>
      <div className={`relative ${aspectRatio} rounded-2xl overflow-hidden bg-[#0b0612] border border-white/10`}>
        <Image 
          src={item.poster} 
          alt={`${item.title} poster - Watch online free on DramaDrift`}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
            isYouTubeThumbnail ? 'object-center' : 'object-top'
          }`}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
          onError={(e) => {
            // Fallback for broken images
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        
        {/* Fallback for broken images */}
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-gray-400 text-sm hidden">
          <span>No Image</span>
        </div>
        
        {/* Overlay gradient for better text readability */}
        <div className="card-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Rating Badge */}
        {showRating && item.rating && (
          <div className="absolute top-2 left-2 badge badge-accent">⭐ {item.rating}</div>
        )}
        
        {/* Year Badge */}
        {showYear && item.year && (
          <div className="absolute top-2 right-2 badge">{item.year}</div>
        )}
        
        {/* Play Button Overlay */}
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-xl ml-1">▶</span>
            </div>
          </div>
        )}

        {/* Progress Bar for Continue Watching */}
        {item.progressPercentage !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${item.progressPercentage}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Title and metadata */}
      <div className="mt-2">
        <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors line-clamp-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>{item.year || new Date().getFullYear()}</span>
          <span>•</span>
          <span>{item.genre?.[0] || 'Entertainment'}</span>
        </div>
      </div>
    </div>
  )

  // Return with or without Link wrapper based on variant
  if (variant === 'no-link') {
    return cardContent
  }

  // Use regular anchor tag to prevent query parameter inheritance from search pages
  return (
    <a href={cleanHref} className="block hover-glow">
      {cardContent}
    </a>
  )
}
