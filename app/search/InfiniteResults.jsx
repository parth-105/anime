'use client'

import React from 'react'
import ContentCard from '@/app/components/ContentCard'

export default function InfiniteResults({ initial, query }){
  const [items, setItems] = React.useState(initial.results || [])
  const [page, setPage] = React.useState(initial.page || 1)
  const [totalPages, setTotalPages] = React.useState(initial.totalPages || 1)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const sentinelRef = React.useRef(null)

  React.useEffect(() => {
    setItems(initial.results || [])
    setPage(initial.page || 1)
    setTotalPages(initial.totalPages || 1)
  }, [initial])

  React.useEffect(() => {
    const el = sentinelRef.current
    if(!el) return
    let cancelled = false
    const io = new IntersectionObserver(async (entries) => {
      const entry = entries[0]
      if(entry.isIntersecting && !loading && page < totalPages){
        setLoading(true)
        setError(null)
        try{
          const params = new URLSearchParams()
          Object.entries(query || {}).forEach(([k,v]) => { if(v !== undefined && v !== null && v !== '') params.set(k, String(v)) })
          params.set('limit', String(initial.pageSize || 24))
          params.set('page', String(page + 1))
          const res = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' })
          if(!res.ok) throw new Error('Failed to load more results')
          const data = await res.json()
          if(!cancelled){
            setItems(prev => prev.concat(data.results || []))
            setPage(data.page || page + 1)
            setTotalPages(data.totalPages || totalPages)
          }
        }catch(e){
          if(!cancelled){ setError('Failed to load more results') }
        }finally{
          if(!cancelled){ setLoading(false) }
        }
      }
    }, { rootMargin: '400px 0px' })
    io.observe(el)
    return () => { cancelled = true; io.disconnect() }
  }, [query, page, totalPages, loading, initial])

  return (
    <div>
      {items.length === 0 && !loading && !error && (
        <div className="text-white/60 text-sm">No results found.</div>
      )}

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mt-4">
        {items.map(item => (
          <ContentCard key={`${item.id}`} item={item} href={`/watch/${item.type}/${item.id}`} className="rounded-xl" />
        ))}
        {loading && (
          Array.from({ length: 12 }).map((_,i) => (
            <div key={`skeleton-${i}`} className="skeleton-card aspect-[2/3]" />
          ))
        )}
      </div>

      <div ref={sentinelRef} className="h-10" />

      {error && (
        <div className="text-red-400 text-sm mt-2">{error}</div>
      )}

      {!loading && page >= totalPages && items.length > 0 && (
        <div className="text-white/40 text-xs mt-4 text-center">You have reached the end.</div>
      )}
    </div>
  )
}


