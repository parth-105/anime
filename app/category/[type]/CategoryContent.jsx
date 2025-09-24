'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { contentTypes, genres } from '@/app/data/movies'
import ContentCard from '@/app/components/ContentCard'

export default function CategoryContent({ type, typeInfo, initial }) {
  const [selectedGenre, setSelectedGenre] = React.useState('all')
  const [items, setItems] = React.useState(initial || [])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [hasMore, setHasMore] = React.useState(true)
  const sentinelRef = React.useRef(null)
  const LIMIT = 24

  React.useEffect(() => {
    // On genre change, reset and refetch first page
    let cancelled = false
    async function loadFirst(){
      setLoading(true); setError(null)
      try{
        const params = new URLSearchParams()
        params.set('type', type)
        if(selectedGenre !== 'all') params.set('genre', selectedGenre)
        params.set('limit', String(LIMIT))
        params.set('page', '1')
        const res = await fetch(`/api/content?${params.toString()}`, { cache: 'no-store' })
        const data = await res.json()
        if(!cancelled){
          const list = Array.isArray(data) ? data : []
          setItems(list)
          setHasMore(list.length === LIMIT)
          // totalPages unknown from this endpoint; use hasMore instead
          setPage(1); setTotalPages(1)
        }
      }catch(e){ if(!cancelled){ setError('Failed to load') } }
      finally{ if(!cancelled){ setLoading(false) } }
    }
    loadFirst()
    return () => { cancelled = true }
  }, [type, selectedGenre])

  React.useEffect(() => {
    const el = sentinelRef.current
    if(!el) return
    let cancelled = false
    const io = new IntersectionObserver(async (entries) => {
      const entry = entries[0]
      if(entry.isIntersecting && !loading && hasMore){
        setLoading(true); setError(null)
        try{
          const params = new URLSearchParams()
          params.set('type', type)
          if(selectedGenre !== 'all') params.set('genre', selectedGenre)
          params.set('limit', String(LIMIT))
          params.set('page', String(page + 1))
          const res = await fetch(`/api/content?${params.toString()}`, { cache: 'no-store' })
          const data = await res.json()
          if(!cancelled){
            const next = Array.isArray(data) ? data : []
            const reachedEnd = next.length < LIMIT
            setHasMore(!reachedEnd)
            setItems(prev => prev.concat(next))
            setPage(p => p + 1)
          }
        }catch(e){ if(!cancelled){ setError('Failed to load more') } }
        finally{ if(!cancelled){ setLoading(false) } }
      }
    }, { rootMargin: '400px 0px' })
    io.observe(el)
    return () => { cancelled = true; io.disconnect() }
  }, [type, selectedGenre, page, totalPages, loading])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-4xl">{typeInfo.icon}</span>
        <div>
          <h1 className="text-3xl font-bold">{typeInfo.name}</h1>
          <p className="text-gray-400">{items.length} titles available</p>
        </div>
      </div>

      {/* Genre Filter (sticky) */}
      <div className="flex flex-wrap gap-2 sticky top-0 z-10 py-2 bg-transparent">
        <button
          onClick={() => setSelectedGenre('all')}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            selectedGenre === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          All Genres
        </button>
        {genres.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedGenre === genre 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map(item => (
          <ContentCard 
            key={item.id} 
            item={item}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No content found for the selected genre.</p>
        </div>
      )}

      {/* Infinite scroll sentinel and states */}
      <div ref={sentinelRef} className="h-10" />
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
          {Array.from({ length: 6 }).map((_,i) => (
            <div key={`cat-skel-${i}`} className="skeleton-card aspect-[2/3]" />
          ))}
        </div>
      )}
      {!loading && !hasMore && items.length > 0 && (
        <div className="mt-4 text-center text-white/40 text-xs">End of list</div>
      )}
      {error && (<div className="text-red-400 text-sm mt-2">{error}</div>)}
    </div>
  )
}
