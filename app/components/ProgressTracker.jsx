'use client'
import React from 'react'
import watchHistoryService from '@/lib/watchHistoryService'

export default function ProgressTracker({ 
  contentId, 
  type, 
  season, 
  episode, 
  title, 
  poster, 
  videoRef
}) {
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [isTracking, setIsTracking] = React.useState(false)

  // Load saved progress on metadata loaded
  React.useEffect(() => {
    const video = videoRef?.current
    if (!video) return
    const onLoaded = () => {
      const saved = watchHistoryService.getProgress(contentId, season, episode)
      if (saved && saved.currentTime && video.duration) {
        video.currentTime = Math.min(saved.currentTime, video.duration - 0.25)
        setCurrentTime(video.currentTime)
      }
    }
    video.addEventListener('loadedmetadata', onLoaded)
    return () => video.removeEventListener('loadedmetadata', onLoaded)
  }, [contentId, season, episode, videoRef])

  // Track video events
  React.useEffect(() => {
    const video = videoRef?.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)
      
      if (isTracking && time > 0) {
        // Save progress every 10 seconds
        if (Math.floor(time) % 10 === 0) {
          watchHistoryService.saveProgress(
            contentId,
            type,
            season,
            episode,
            time,
            duration,
            title,
            poster
          )
        }
      }
    }

    const handleDurationChange = () => {
      setDuration(video.duration || 0)
    }

    const handlePlay = () => {
      setIsTracking(true)
      // Ensure an entry exists as soon as playback starts
      watchHistoryService.saveProgress(
        contentId,
        type,
        season,
        episode,
        video.currentTime,
        duration || video.duration || 0,
        title,
        poster
      )
    }

    const handlePause = () => {
      setIsTracking(false)
      // Save progress when paused
      watchHistoryService.saveProgress(
        contentId,
        type,
        season,
        episode,
        video.currentTime,
        duration,
        title,
        poster
      )
    }

    const handleEnded = () => {
      setIsTracking(false)
      // Mark as completed when video ends
      watchHistoryService.markCompleted(contentId, season, episode)
    }

    // Save on tab close / navigation
    const handleBeforeUnload = () => {
      try {
        watchHistoryService.saveProgress(
          contentId,
          type,
          season,
          episode,
          video.currentTime,
          duration,
          title,
          poster
        )
      } catch {}
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [contentId, type, season, episode, title, poster, duration, isTracking])

  // Handle URL time parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const startTime = urlParams.get('t')
    if (startTime && videoRef.current) {
      videoRef.current.currentTime = parseFloat(startTime)
    }
  }, [])

  // No imperative handle needed; parent passes the actual videoRef

  return (
    <div className="progress-tracker">
      {/* Progress indicator */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div 
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
