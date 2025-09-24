'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ContentCard from './ContentCard'
import watchHistoryService from '@/lib/watchHistoryService'

export default function RelatedContent({ currentItem, library, variant = 'sidebar' }) {
  // Build lightweight, on-device personalized recommendations
  const [relatedItems, setRelatedItems] = React.useState([])

  React.useEffect(() => {
    if(!currentItem) { setRelatedItems([]); return }

    const build = async () => {
      // Prepare candidate pool: prefer provided library; otherwise fetch from API
      let candidates = Array.isArray(library) ? [...library] : []
      if(!candidates || candidates.length < 30){
        try{
          const paramsSameType = new URLSearchParams({ type: currentItem.type || '', limit: '60', page: '1' })
          const resType = await fetch(`/api/content?${paramsSameType.toString()}`, { cache: 'no-store' })
          const byType = resType.ok ? await resType.json() : []
          const paramsRecent = new URLSearchParams({ limit: '60', page: '1' })
          const resRecent = await fetch(`/api/content?${paramsRecent.toString()}`, { cache: 'no-store' })
          const recent = resRecent.ok ? await resRecent.json() : []
          const map = new Map()
          ;[...byType, ...recent].forEach(i => { if(i && i.id) map.set(i.id, i) })
          candidates = Array.from(map.values())
        }catch{
          // fallback to given library or empty
          candidates = candidates || []
        }
      }

      // Load local history
      let history = []
      try { history = watchHistoryService.getHistory() || [] } catch {}

    // Derive user preferences from recent history
    const recent = history.slice(0, 25)
    const completedIds = new Set(recent.filter(h => (h.progressPercentage || 0) >= 90).map(h => h.contentId))
    const typeCount = recent.reduce((acc, h) => { if(h.type){ acc[h.type] = (acc[h.type]||0)+1 } return acc }, {})
    const genreCount = recent.reduce((acc, h) => {
      const libItem = candidates.find(i => i.id === h.contentId)
      const genres = libItem?.genre || []
      genres.forEach(g => { acc[g] = (acc[g]||0)+1 })
      return acc
    }, {})

    const userTopTypes = new Set(Object.entries(typeCount).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t))
    const userTopGenres = new Set(Object.entries(genreCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([g])=>g))

    const currentGenres = new Set(currentItem.genre || [])
    const currentType = currentItem.type
    const currentYear = currentItem.year || null

    const scored = candidates
      .filter(it => it.id !== currentItem.id)
      .filter(it => !completedIds.has(it.id))
        .filter(it => it.poster)
      .map(it => {
        let score = 0
        // Content similarity
        if(it.type === currentType) score += 3
        const overlap = (it.genre || []).reduce((n,g)=> n + (currentGenres.has(g) ? 1 : 0), 0)
        score += overlap * 2
        if(it.year && currentYear){
          const dy = Math.abs(Number(it.year) - Number(currentYear))
          score += Math.max(0, 2 - dy/5) // smaller gap, higher score
        }
        // Preference boosts
        if(userTopTypes.has(it.type)) score += 1.5
        const prefGenres = (it.genre || []).reduce((n,g)=> n + (userTopGenres.has(g) ? 1 : 0), 0)
        score += prefGenres * 0.8
        // Popularity proxy
        if(typeof it.rating === 'number') score += it.rating * 0.1
        return { it, score }
      })
      .sort((a,b)=> b.score - a.score)

    const take = variant === 'sidebar' ? 6 : 18
    setRelatedItems(scored.slice(0, take).map(s => s.it))
    }

    build()
  }, [library, currentItem, variant])

  if (relatedItems.length === 0) return null

  // Sidebar stacked list
  if (variant === 'sidebar') {
    return (
      <div className="glass-panel rounded-2xl card-pad">
        <h3 className="text-sm tracking-widest text-white/80 mb-3">MORE LIKE THIS</h3>
        <div className="space-y-2">
          {relatedItems.slice(0,6).map(related => (
            <Link 
              key={related.id} 
              href={`/watch/${related.type}/${related.id}/0/0`} 
              className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors hover-glow"
            >
              <div className="relative w-14 h-20 rounded-lg overflow-hidden">
                <Image src={related.poster} alt={`${related.title} poster`} fill className="object-cover" sizes="56px" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{related.title}</div>
                <div className="text-xs text-gray-400">{related.year || new Date().getFullYear()}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Rail layout (attention-grabbing like Netflix)
  return (
    <div className="glass-panel rounded-2xl card-pad">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm tracking-widest text-white/80">MORE LIKE THIS</h3>
        <span className="text-xs text-white/60">Recommended for you</span>
      </div>
      <div className="relative">
        <div className="grid grid-flow-col auto-cols-[55%] sm:auto-cols-[42%] md:auto-cols-[30%] lg:auto-cols-[22%] xl:auto-cols-[18%] gap-4 overflow-x-auto no-scrollbar py-2">
          {relatedItems.map(related => (
            <ContentCard
              key={related.id}
              item={related}
              href={`/watch/${related.type}/${related.id}/0/0`}
              className="rounded-2xl"
              showRating={false}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
