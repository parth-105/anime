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
  
  // Create a unique key for this search to force complete reset
  const searchKey = React.useMemo(() => {
    return `${query?.q || ''}-${query?.type || ''}-${query?.genre || ''}-${query?.sort || ''}`
  }, [query])

  React.useEffect(() => {
    if(process.env.NODE_ENV !== 'production'){
     // console.log('[INFINITE-RESULTS] Initial changed, setting items:', initial.results?.length, 'items')
    }
    setItems(initial.results || [])
    setPage(initial.page || 1)
    setTotalPages(initial.totalPages || 1)
  }, [initial])

  // Reset results when query changes
  React.useEffect(() => {
    if(process.env.NODE_ENV !== 'production'){
    //  console.log('[INFINITE-RESULTS] Search key changed, resetting results:', searchKey)
    }
    setItems(initial.results || [])
    setPage(initial.page || 1)
    setTotalPages(initial.totalPages || 1)
    setLoading(false)
    setError(null)
  }, [searchKey, initial])

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
          params.set('_t', String(Date.now() + Math.random()))
          
          if(process.env.NODE_ENV !== 'production'){
         //   console.log('[INFINITE-RESULTS] Loading page:', page + 1, 'of', totalPages)
          }
          
          const res = await fetch(`/api/search?${params.toString()}`, { 
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          if(!res.ok) throw new Error('Failed to load more results')
          const data = await res.json()
          if(!cancelled){
            setItems(prev => prev.concat(data.results || []))
            setPage(data.page || page + 1)
            setTotalPages(data.totalPages || totalPages)
            
            if(process.env.NODE_ENV !== 'production'){
            //  console.log('[INFINITE-RESULTS] Loaded', data.results?.length, 'more items. Total:', items.length + (data.results?.length || 0))
            }
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
    <div className="space-y-4">
      {items.length === 0 && !loading && !error && (
        <div className="text-white/60 text-sm">No results found.</div>
      )}

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map(item => {
          if(process.env.NODE_ENV !== 'production'){
          //  console.log('[INFINITE-RESULTS] Rendering item:', item.title, item.id, 'type:', item.type, 'seasons:', item.seasons?.length)
          }
          
          // Generate proper href based on content type (clean URLs without query params)
          let href
          
          // Production-level URL generation with comprehensive fallbacks
          if (item.type === 'movie') {
            href = `/watch/movie/${encodeURIComponent(item.id)}/0/0`
          } else {
            // For series/anime/kdrama, we need to determine the proper route
            const hasSeasons = item.seasons && Array.isArray(item.seasons) && item.seasons.length > 0
            const firstSeason = hasSeasons ? item.seasons[0] : null
            const firstEpisode = firstSeason?.episodes?.[0]
            
            if (process.env.NODE_ENV !== 'production'){
              // console.log('[INFINITE-RESULTS] Content analysis:', { 
              //   type: item.type,
              //   format: item.format,
              //   hasSeasons,
              //   seasonsLength: item.seasons?.length,
              //   firstSeason: firstSeason,
              //   firstEpisode: firstEpisode,
              //   isAnimeMovie: item.type === 'anime' && item.format === 'movie',
              //   fullItem: item
              // })
            }
            
            // Determine if this is episodic content
            const isEpisodic = hasSeasons && !(item.type === 'anime' && item.format === 'movie')
            
            if (isEpisodic && firstSeason && firstEpisode && firstEpisode.id) {
              // Episodic content with valid season/episode data
              href = `/watch/${item.type}/${encodeURIComponent(item.id)}/${firstSeason.season}/${firstEpisode.id}`
            } else if (item.type === 'anime' && item.format === 'movie') {
              // Anime movies should use movie format
              href = `/watch/movie/${encodeURIComponent(item.id)}/0/0`
            } else {
              // Production-level fallback: try to find any available season/episode
              if (hasSeasons) {
                // Try to find any valid season/episode
                for (const season of item.seasons) {
                  if (season.episodes && season.episodes.length > 0) {
                    const episode = season.episodes[0]
                    if (episode.id) {
                      href = `/watch/${item.type}/${encodeURIComponent(item.id)}/${season.season}/${episode.id}`
                      break
                    }
                  }
                }
              }
              
              // If still no valid href, use default season/episode structure
              if (!href) {
                // For content without season/episode data, use default structure
                // This ensures we always go to the final route, not intermediate
                if (item.type === 'kdrama' || item.type === 'series' || item.type === 'anime') {
                  // Use default season 1 and episode 1 for content without proper data
                  href = `/watch/${item.type}/${encodeURIComponent(item.id)}/1/1`
                } else {
                  // Fallback to basic route only as last resort
                  href = `/watch/${item.type}/${encodeURIComponent(item.id)}`
                }
              }
            }
          }
          
          // Ensure the href is clean (no query parameters)
          href = href.split('?')[0]
          
          if(process.env.NODE_ENV !== 'production'){
            // console.log('[INFINITE-RESULTS] Generated href:', href)
            // console.log('[INFINITE-RESULTS] Item data:', { id: item.id, type: item.type, title: item.title })
          }
          
          return (
            <ContentCard key={`${item.id}`} item={item} href={href} className="rounded-xl" />
          )
        })}
        {loading && (
          Array.from({ length: 12 }).map((_,i) => (
            <div key={`skeleton-${i}`} className="skeleton-card aspect-[2/3]" />
          ))
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="text-white/60 text-sm">Loading more results...</div>
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-10" />

      {error && (
        <div className="text-red-400 text-sm mt-2 text-center">{error}</div>
      )}

      {!loading && page >= totalPages && items.length > 0 && (
        <div className="text-white/40 text-xs mt-4 text-center">You have reached the end.</div>
      )}
    </div>
  )
}


