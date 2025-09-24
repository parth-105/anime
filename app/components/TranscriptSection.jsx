'use client'
import { useState } from 'react'

export default function TranscriptSection({ subtitles }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!subtitles || subtitles.length === 0) return null

  return (
    <div className="card p-4 rounded">
      <h3 className="font-semibold mb-3">Transcript</h3>
      <p className="text-sm text-gray-400 mb-2">
        Available in: {subtitles.map(s => s.label).join(', ')}
      </p>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="control-btn text-xs"
      >
        {isExpanded ? 'Hide' : 'Show'} Transcript
      </button>
      {isExpanded && (
        <div className="mt-3 text-xs text-gray-300">
          <p>This is a sample transcript. In production, this would be fetched from the WebVTT files and displayed as searchable text content for better SEO.</p>
          <p className="mt-2">The transcript helps search engines understand the content of your video, improving your chances of ranking for relevant search queries.</p>
          <p className="mt-2">For example, if someone searches for "action scene" and your video contains that in the transcript, it's more likely to appear in search results.</p>
        </div>
      )}
    </div>
  )
}
