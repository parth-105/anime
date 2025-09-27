import { headers } from 'next/headers'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

function resolveApi(url){
  // In server context, construct absolute URL using incoming request headers
  if (typeof window === 'undefined'){
    try{
      const h = headers()
      const host = h.get('host')
      const proto = h.get('x-forwarded-proto') || (process.env.NODE_ENV === 'development' ? 'http' : 'https')
      return `${proto}://${host}${url.startsWith('/') ? url : `/${url}`}`
    }catch{ /* fallback below */ }
  }
  return url
}

export async function fetchContent({ q, type, genre, limit = 24, page = 1 } = {}){
  const params = new URLSearchParams()
  if(q) params.set('q', q)
  if(type) params.set('type', type)
  if(genre) params.set('genre', genre)
  params.set('limit', String(limit))
  params.set('page', String(page))
  const res = await fetch(resolveApi(`${API_BASE}/content?${params.toString()}`), { cache: 'no-store' })
  if(!res.ok) throw new Error('Failed to load content')
  return res.json()
}

export async function fetchContentById(id){
  const res = await fetch(resolveApi(`${API_BASE}/content/${id}`), { cache: 'no-store' })
  if(res.status === 404) return null
  if(!res.ok) throw new Error('Failed to load title')
  return res.json()
}

export async function searchContent(params = {}){
  const {
    q,
    type,
    format,
    genre,
    yearFrom,
    yearTo,
    minRating,
    sort,
    limit = 24,
    page = 1
  } = params

  const search = new URLSearchParams()
  if(q) search.set('q', q)
  if(type) search.set('type', type)
  if(format) search.set('format', format)
  if(genre) search.set('genre', genre)
  if(typeof yearFrom !== 'undefined') search.set('yearFrom', String(yearFrom))
  if(typeof yearTo !== 'undefined') search.set('yearTo', String(yearTo))
  if(typeof minRating !== 'undefined') search.set('minRating', String(minRating))
  if(sort) search.set('sort', sort)
  search.set('limit', String(limit))
  search.set('page', String(page))
  // Add cache-busting parameter with random component
  search.set('_t', String(Date.now() + Math.random()))

  const res = await fetch(resolveApi(`${API_BASE}/search?${search.toString()}`), { 
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
  if(!res.ok) {
    const errorText = await res.text()
  //  console.error('[CONTENT-SERVICE] Search API error:', res.status, res.statusText, errorText)
    throw new Error(`Failed to search content: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function fetchTrendingContent({ limit = 24, page = 1 } = {}){
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('page', String(page))
  const res = await fetch(resolveApi(`${API_BASE}/trending?${params.toString()}`), { cache: 'no-store' })
  if(!res.ok) throw new Error('Failed to load trending content')
  return res.json()
}


