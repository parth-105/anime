'use client'

import React from 'react'
import ContentCard from '@/app/components/ContentCard'

export default function ContentRail({ title, icon, query = {}, initialLimit = 12 }){
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    const el = ref.current
    if(!el) return
    let cancelled = false
    const io = new IntersectionObserver(async (entries) => {
      const entry = entries[0]
      if(entry.isIntersecting && !hasLoadedOnce){
        setLoading(true)
        setError(null)
        try{
          const params = new URLSearchParams()
          Object.entries(query).forEach(([k,v]) => { if(v !== undefined && v !== null && v !== '') params.set(k, String(v)) })
          params.set('limit', String(initialLimit))
          params.set('page', '1')
          const res = await fetch(`/api/content?${params.toString()}`, { cache: 'no-store' })
          if(!res.ok) throw new Error('Failed to load')
          const data = await res.json()
          if(!cancelled){ setItems(Array.isArray(data) ? data : []) }
        }catch(e){
          if(!cancelled){ setError('Failed to load') }
        }finally{
          if(!cancelled){ setLoading(false); setHasLoadedOnce(true) }
        }
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => { cancelled = true; io.disconnect() }
  }, [query, initialLimit, hasLoadedOnce])

  return (
    <section className="glass-panel rounded-3xl card-pad section-gap" ref={ref}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 tracking-wider">
          <span className="text-2xl">{icon || '📺'}</span>
          {title}
          {items.length > 0 && (
            <span className="text-sm font-normal text-gray-400">({items.length})</span>
          )}
        </h2>
      </div>

      {loading && items.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 rail-gap">
          {Array.from({ length: initialLimit }).map((_,i) => (
            <div key={i} className="skeleton-card aspect-[2/3]" />
          ))}
        </div>
      )}

      {error && items.length === 0 && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 rail-gap">
          {items.map(item => (
            <ContentCard key={item.id} item={item} className="rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && !error && hasLoadedOnce && items.length === 0 && (
        <div className="text-sm text-white/60">No items found.</div>
      )}
    </section>
  )
}


