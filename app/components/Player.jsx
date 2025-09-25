'use client'
import React, { useRef, useEffect, useState } from 'react'
import Hls from 'hls.js'

export default function Player({ src, subtitles = [], seriesInfo = null, initialEpisodeIndex = 0 }){
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentSub, setCurrentSub] = useState(subtitles?.[0]?.lang || 'none')
  const [error, setError] = useState(null)
  const [episodeIndex, setEpisodeIndex] = useState(initialEpisodeIndex)

  // load video via HLS.js for HLS playback on all browsers
  useEffect(() => {
    const video = videoRef.current
    if(!video) return
    if(hlsRef.current){
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if(Hls.isSupported()){
      const hls = new Hls({ capLevelToPlayerSize: true, enableWorker: true })
      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        // Try to auto-play, but handle browser autoplay policy gracefully
        try {
          await video.play()
          setPlaying(true)
        } catch (err) {
          // Autoplay blocked - user needs to click to start
       //   console.log('Autoplay blocked, waiting for user interaction')
        }
      })
      hls.on(Hls.Events.ERROR, (e, data) => {
        console.error('HLS error', e, data)
        setError('Playback error — try again')
      })
    } else {
      // fallback to native
      video.src = src
    }

    // cleanup
    return () => {
      if(hlsRef.current){ hlsRef.current.destroy(); hlsRef.current = null }
    }
  }, [src])

  // handle subtitles tracks — we will add <track> elements dynamically to avoid page reload
  useEffect(() => {
    const video = videoRef.current
    if(!video) return

    // remove existing tracks
    const existing = Array.from(video.querySelectorAll('track'))
    existing.forEach(t => t.remove())

    subtitles.forEach(sub => {
      const track = document.createElement('track')
      track.kind = 'subtitles'
      track.label = sub.label
      track.srclang = sub.lang
      track.src = sub.src
      track.default = sub.lang === currentSub
      video.appendChild(track)
    })

    // set currentSub active
    setTimeout(() => {
      const tracks = video.textTracks
      for(let i=0;i<tracks.length;i++){
        tracks[i].mode = (tracks[i].language === currentSub) ? 'showing' : 'disabled'
      }
    }, 200)

  }, [subtitles, currentSub])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) =>{
      if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return
      if(e.key === ' '){ e.preventDefault(); togglePlay() }
      if(e.key === 'ArrowRight'){ seek(10) }
      if(e.key === 'ArrowLeft'){ seek(-10) }
      if(e.key === 'n' && seriesInfo){ goNextEpisode() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const togglePlay = async () => {
    const v = videoRef.current
    try{
      if(v.paused) await v.play()
      else v.pause()
      setPlaying(!v.paused)
    } catch(err){ setError('Playback blocked by browser — tap to start') }
  }

  const seek = (sec) => {
    const v = videoRef.current
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec))
  }

  const changeSubtitle = (lang) => {
    setCurrentSub(lang)
    const v = videoRef.current
    const tracks = v.textTracks
    for(let i=0;i<tracks.length;i++){
      tracks[i].mode = (tracks[i].language === lang) ? 'showing' : 'disabled'
    }
  }

  const goNextEpisode = () => {
    if(!seriesInfo) return
    const eps = seriesInfo.episodes
    const nextIndex = Math.min(eps.length - 1, episodeIndex + 1)
    if(nextIndex === episodeIndex) return
    const next = eps[nextIndex]

    // replace src — Hls.js instance will be recreated by effect when `src` prop of parent changes
    // Here we manually change current src while staying on same page by updating location.
    // For demo: reload by setting video.src and re-attach HLS
    window.location.href = `/watch/series/${seriesInfo.item.id}/${seriesInfo.season.season}/${next.id}`
  }

  return (
    <div>
      <div className="relative video-ui rounded overflow-hidden">
        <video ref={videoRef} controls={false} className="w-full h-[520px] bg-black" playsInline onClick={togglePlay} />

        {/* Controls overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="control-btn" onClick={() => seek(-10)}>◀ 10s</button>
            <button className="control-btn" onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
            <button className="control-btn" onClick={() => seek(10)}>10s ▶</button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm opacity-80">Subtitles</label>
            <select className="control-btn" value={currentSub} onChange={(e)=>changeSubtitle(e.target.value)}>
              <option value="none">Off</option>
              {subtitles.map(s => <option key={s.lang} value={s.lang}>{s.label}</option>)}
            </select>

            {seriesInfo && (
              <button className="control-btn" onClick={goNextEpisode}>Next Episode ▶</button>
            )}
          </div>
        </div>

        {error && <div className="absolute top-4 left-4 bg-red-600/80 p-2 rounded">{error}</div>}
        
        {/* Large play button overlay when not playing */}
        {!playing && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <button 
              onClick={togglePlay}
              className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-4xl transition-all hover:scale-110"
            >
              ▶
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 text-sm opacity-80">Tip: Press Space to toggle play, ← / → for 10s seek, 'n' for next episode (if available).</div>
    </div>
  )
}


