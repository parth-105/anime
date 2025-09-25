'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

function buildQuery(params){
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if(value !== undefined && value !== null && String(value).trim() !== ''){
      search.set(key, String(value))
    }
  })
  return search.toString()
}

function buildFilteredQueryFromSearchParams(sp){
  const current = {
    q: sp.get('q') || '',
    type: sp.get('type') || '',
    sort: sp.get('sort') || '',
    page: sp.get('page') || '1'
  }
  // Normalize defaults so comparisons are stable
  if(!current.sort) delete current.sort
  if(!current.type) delete current.type
  if(!current.q) delete current.q
  if(current.page === '1') delete current.page
  return buildQuery(current)
}

export default function SearchClient(){
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const inputRef = useRef(null)
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || (q ? 'relevance' : 'recent'))

  const qs = useMemo(() => ({ q, type, sort, page: 1 }), [q, type, sort])

  useEffect(() => {
    const t = setTimeout(() => {
      const nextQuery = buildQuery(qs)
      const currentQuery = buildFilteredQueryFromSearchParams(searchParams)
      // Debug: log client-side query comparison
      if(process.env.NODE_ENV !== 'production'){
        // eslint-disable-next-line no-console
      //  console.log('[SEARCH-CLIENT] nextQuery', nextQuery, 'currentQuery', currentQuery)
      }
      if(nextQuery !== currentQuery){
        router.replace(`${pathname}?${nextQuery}`, { scroll: false })
      }
    }, 400)
    return () => clearTimeout(t)
  }, [qs, router, pathname, searchParams])

  return (
    <div className="glass-panel rounded-2xl card-pad flex items-center gap-3">
      <input
        ref={inputRef}
        type="text"
        name="q"
        defaultValue={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search titles, genres, people…"
        className="flex-1 h-11 rounded-full bg-white/5 border border-white/10 px-4 text-white/90 placeholder-white/60 outline-none"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
      />
      <select name="type" value={type} onChange={e => setType(e.target.value)} className="select pr-10 relative">
        <option value="">All</option>
        <option value="movie">Movies</option>
        <option value="series">Series</option>
        <option value="anime">Anime</option>
        <option value="kdrama">K-Drama</option>
      </select>
      <select name="sort" value={sort} onChange={e => setSort(e.target.value)} className="select pr-10 relative">
        <option value="relevance">Relevance</option>
        <option value="recent">Most recent</option>
        <option value="rating">Top rated</option>
        <option value="year">Newest year</option>
      </select>
      <button type="button" className="ml-2 w-11 h-11 rounded-xl bg-white/10 border border-white/10 grid place-items-center">🔍</button>
    </div>
  )
}


