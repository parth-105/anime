'use client'

import React from 'react'

export default function ShareButton({ title }){
  const [copied, setCopied] = React.useState(false)

  const shareData = () => {
    try{
      const { origin, pathname, search, hash } = window.location
      const url = `${origin}${pathname}${search}${hash}`
      return { title: title || 'Watch on NeonFlix', url }
    }catch{
      return { title: title || 'Watch on NeonFlix', url: '' }
    }
  }

  const handleShare = async () => {
    const data = shareData()
    try{
      if(typeof navigator !== 'undefined' && navigator.share){
        await navigator.share({ title: data.title, url: data.url })
        return
      }
    }catch{}
    // Fallback: show simple share options
    openFallback()
  }

  const copyToClipboard = async () => {
    try{
      await navigator.clipboard.writeText(shareData().url)
      setCopied(true)
      setTimeout(()=>setCopied(false), 1500)
    }catch{}
  }

  const openUrl = (u) => {
    try{ window.open(u, '_blank', 'noopener,noreferrer') }catch{}
  }

  const openFallback = () => {
    const { url } = shareData()
    // Try WhatsApp with URL-only for richer previews
    const wa = `https://wa.me/?text=${encodeURIComponent(url)}`
    openUrl(wa)
  }

  // Optional: dropdown with more networks
  const [open, setOpen] = React.useState(false)
  const toggle = () => setOpen(v=>!v)

  return (
    <div className="relative inline-block">
      <button className="pill hover-glow" onClick={handleShare} onMouseDown={(e)=>e.preventDefault()}>🔗 Share</button>
      <button className="pill hover-glow ml-2" onClick={toggle} aria-label="More share options">⋯</button>
      {open && (
        <div className="absolute right-0 mt-2 min-w-[220px] glass-panel rounded-xl p-2 z-20">
          <div className="text-xs text-white/70 px-2 py-1">Share via</div>
          <div className="flex flex-col">
            <button className="text-left px-3 py-2 hover:bg-white/10 rounded" onClick={()=>openUrl(`https://wa.me/?text=${encodeURIComponent(shareData().url)}`)}>WhatsApp</button>
            <button className="text-left px-3 py-2 hover:bg-white/10 rounded" onClick={()=>openUrl(`https://t.me/share/url?url=${encodeURIComponent(shareData().url)}`)}>Telegram</button>
            <button className="text-left px-3 py-2 hover:bg-white/10 rounded" onClick={()=>openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData().url)}`)}>Facebook</button>
            <button className="text-left px-3 py-2 hover:bg-white/10 rounded" onClick={()=>openUrl(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData().url)}`)}>Twitter / X</button>
            <button className="text-left px-3 py-2 hover:bg-white/10 rounded" onClick={copyToClipboard}>{copied ? 'Copied!' : 'Copy link'}</button>
          </div>
        </div>
      )}
    </div>
  )
}


