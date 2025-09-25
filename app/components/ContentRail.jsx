'use client'

import React from 'react'
import Link from 'next/link'
import ContentCard from '@/app/components/ContentCard'

export default function ContentRail({ title, icon, query = {}, initialLimit = 12, source = 'content', hideWhenEmpty = true }){
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
          const endpoint = source === 'trending' ? '/api/trending' : '/api/content'
          const url = source === 'trending' ? endpoint : `${endpoint}?${params.toString()}`
          if(process.env.NODE_ENV !== 'production'){
            // eslint-disable-next-line no-console
       //     console.log('[CONTENT-RAIL] fetching', { title, source, url, query, initialLimit })
          }
          const res = await fetch(url, { cache: 'no-store' })
          if(!res.ok) throw new Error('Failed to load')
          const data = await res.json()
          if(process.env.NODE_ENV !== 'production'){
            // eslint-disable-next-line no-console
       //     console.log('[CONTENT-RAIL] loaded', { title, count: Array.isArray(data) ? data.length : 0 })
          }
          if(!cancelled){ setItems(Array.isArray(data) ? data : []) }
        }catch(e){
          if(process.env.NODE_ENV !== 'production'){
            // eslint-disable-next-line no-console
            console.error('[CONTENT-RAIL] error', e)
          }
          if(!cancelled){ setError('Failed to load') }
        }finally{
          if(!cancelled){ setLoading(false); setHasLoadedOnce(true) }
        }
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => { cancelled = true; io.disconnect() }
  }, [query, initialLimit, hasLoadedOnce])

  // Build search link for "See all" using the same query + sensible defaults
  const buildSeeAllHref = React.useMemo(() => {
    const params = new URLSearchParams()
    Object.entries(query || {}).forEach(([k, v]) => {
      if(v !== undefined && v !== null && String(v).trim() !== ''){
        params.set(k, String(v))
      }
    })
    // Map common rail queries to search params
    // If a rail passed { sort: 'rating' } etc., preserve it
    // Content rails may also include type filters
    return `/search?${params.toString()}`
  }, [query])

  const shouldHide = hideWhenEmpty && !loading && !error && hasLoadedOnce && items.length === 0
  if(shouldHide){ return null }

  return (
    <section className="glass-panel rounded-3xl card-pad section-gap" ref={ref}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 tracking-wider">
          <span className="text-2xl">{icon || '📺'}</span>
          {title}
        </h2>
        <Link href={buildSeeAllHref} className="text-sm text-blue-400 hover:text-blue-300 hover:underline whitespace-nowrap">
          See all →
        </Link>
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
        <div className="overflow-x-auto overflow-y-visible no-scrollbar fade-edges-x">
          <div className="flex gap-4 snap-x snap-mandatory pb-2">
            <div aria-hidden className="rail-fade-spacer" />
            {items.map(item => (
              <div key={item.id} className="min-w-[160px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px] snap-start">
                <ContentCard item={item} className="rounded-2xl" />
              </div>
            ))}
            <div aria-hidden className="rail-fade-spacer" />
          </div>
        </div>
      )}

      {!loading && !error && hasLoadedOnce && items.length === 0 && !hideWhenEmpty && (
        <div className="text-sm text-white/60">No items found.</div>
      )}
    </section>
  )
}


