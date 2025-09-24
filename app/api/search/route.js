import mongoose from 'mongoose'
import { headers } from 'next/headers'
import Content from '@/app/models/Content'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neonflix'
let cached = global._neonflix_mongoose
if(!cached){ cached = global._neonflix_mongoose = { conn: null, promise: null } }

async function db(){
  if(cached.conn) return cached.conn
  if(!cached.promise){ cached.promise = mongoose.connect(MONGO_URI, { autoIndex:false }).then(m=>m) }
  cached.conn = await cached.promise
  return cached.conn
}

function clampNumber(value, { min, max, fallback }){
  if(value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  if(Number.isFinite(n)) return Math.min(Math.max(n, min), max)
  return fallback
}

function safeString(value){
  if(typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function escapeRegex(input){
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(req){
  // Simple in-memory rate limit per IP (bursty protection). For production, move to Redis.
  try{
    const h = headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
    const now = Date.now()
    if(!global.__searchRate){ global.__searchRate = new Map() }
    const bucket = global.__searchRate.get(ip) || { count: 0, ts: now }
    if(now - bucket.ts > 10_000){ bucket.count = 0; bucket.ts = now }
    bucket.count += 1
    global.__searchRate.set(ip, bucket)
    if(bucket.count > 30){
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
  }catch{}
  await db()
  const { searchParams } = new URL(req.url)
  console.log('[SEARCH] url', req.url)

  const q = safeString(searchParams.get('q'))
  const type = safeString(searchParams.get('type'))
  const format = safeString(searchParams.get('format'))
  const genre = safeString(searchParams.get('genre'))
  const yearFrom = clampNumber(searchParams.get('yearFrom'), { min: 1900, max: 3000, fallback: undefined })
  const yearTo = clampNumber(searchParams.get('yearTo'), { min: 1900, max: 3000, fallback: undefined })
  const minRating = clampNumber(searchParams.get('minRating'), { min: 0, max: 10, fallback: undefined })
  const limit = clampNumber(searchParams.get('limit'), { min: 1, max: 60, fallback: 24 })
  const page = clampNumber(searchParams.get('page'), { min: 1, max: 500, fallback: 1 })
  const sortParam = safeString(searchParams.get('sort')) || (q ? 'relevance' : 'recent')

  const query = {}
  if(type) query.type = type
  if(format) query.format = format
  if(genre) query.genre = genre
  if(typeof yearFrom === 'number' || typeof yearTo === 'number'){
    query.year = {}
    if(typeof yearFrom === 'number') query.year.$gte = yearFrom
    if(typeof yearTo === 'number') query.year.$lte = yearTo
  }
  if(typeof minRating === 'number') query.rating = { $gte: minRating }

  // Build search component of the query
  let useText = false
  if(q){
    const safe = escapeRegex(q)
    const regexClauses = [
      { id: { $regex: safe, $options: 'i' } },
      { title: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { genre: { $regex: safe, $options: 'i' } },
      { cast: { $regex: safe, $options: 'i' } },
      { director: { $regex: safe, $options: 'i' } },
      // Episode-aware matching: episode title or ID within seasons
      { 'seasons.episodes.title': { $regex: safe, $options: 'i' } },
      { 'seasons.episodes.id': { $regex: safe, $options: 'i' } },
      // Common abbreviations: ep/e/E
      { title: { $regex: `\\b(e|ep|episode)\\s*${safe}`, $options: 'i' } }
    ]
    if(q.length >= 2){
      // Combine text and regex so we match even if text index behaves unexpectedly
      query.$or = [ { $text: { $search: q } }, ...regexClauses ]
      useText = true
    }else{
      query.$or = regexClauses
    }
  }

  let sort = { createdAt: -1 }
  if(sortParam === 'relevance' && useText){
    sort = { score: { $meta: 'textScore' } }
  }else if(sortParam === 'recent'){
    sort = { createdAt: -1 }
  }else if(sortParam === 'rating'){
    sort = { rating: -1, createdAt: -1 }
  }else if(sortParam === 'year'){
    sort = { year: -1, createdAt: -1 }
  }

  const projection = useText ? { score: { $meta: 'textScore' } } : undefined
  console.log('[SEARCH] params', { q, type, format, genre, yearFrom, yearTo, minRating, sort: sortParam, page, limit })
  console.log('[SEARCH] query', JSON.stringify(query))

  let total = 0
  let results = []
  try{
    ;[total, results] = await Promise.all([
      Content.countDocuments(query),
      Content.find(query, projection)
        .sort(sort)
        .limit(limit)
        .skip((page-1)*limit)
        .select({
          _id: 0,
          id: 1,
          type: 1,
          format: 1,
          title: 1,
          year: 1,
          poster: 1,
          rating: 1,
          genre: 1,
          createdAt: 1
        })
    ])
  }catch(err){
    // Fallback if text index is missing: replace $text with case-insensitive regex on title and description
    if(useText && err?.codeName === 'IndexNotFound'){
      delete query.$text
      const safe = escapeRegex(q || '')
      query.$or = [
        { id: { $regex: safe, $options: 'i' } },
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { genre: { $regex: safe, $options: 'i' } },
        { cast: { $regex: safe, $options: 'i' } },
        { director: { $regex: safe, $options: 'i' } }
      ]
      useText = false
      sort = sortParam === 'recent' ? { createdAt: -1 } : (sortParam === 'rating' ? { rating: -1, createdAt: -1 } : (sortParam === 'year' ? { year: -1, createdAt: -1 } : { createdAt: -1 }))
      const res = await Promise.all([
        Content.countDocuments(query),
        Content.find(query)
          .sort(sort)
          .limit(limit)
          .skip((page-1)*limit)
          .select({
            _id: 0,
            id: 1,
            type: 1,
            format: 1,
            title: 1,
            year: 1,
            poster: 1,
            rating: 1,
            genre: 1,
            createdAt: 1
          })
      ])
      total = res[0]
      results = res[1]
    }else{
      console.error('Search error', err)
      return Response.json({ error: 'Search failed' }, { status: 500 })
    }
  }

  console.log('[SEARCH] initial total', total)

  // If text search yielded zero results but q present, try a best-effort regex across key fields
  if(useText && q && total === 0){
    const safe = escapeRegex(q)
    const fallbackQuery = { ...query }
    delete fallbackQuery.$text
    fallbackQuery.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { genre: { $regex: safe, $options: 'i' } },
      { cast: { $regex: safe, $options: 'i' } },
      { director: { $regex: safe, $options: 'i' } }
    ]
    const res = await Promise.all([
      Content.countDocuments(fallbackQuery),
      Content.find(fallbackQuery)
        .sort(sortParam === 'recent' ? { createdAt: -1 } : (sortParam === 'rating' ? { rating: -1, createdAt: -1 } : (sortParam === 'year' ? { year: -1, createdAt: -1 } : { createdAt: -1 })))
        .limit(limit)
        .skip((page-1)*limit)
        .select({
          _id: 0,
          id: 1,
          type: 1,
          format: 1,
          title: 1,
          year: 1,
          poster: 1,
          rating: 1,
          genre: 1,
          createdAt: 1
        })
    ])
    results = res[1]
    total = res[0]
  }

  // Final fallback: AND-match all words across key fields if still zero
  if(q && total === 0){
    const terms = q.split(/\s+/).filter(Boolean).map(escapeRegex)
    if(terms.length){
      const andClauses = terms.map(t => ({
        $or: [
          { id: { $regex: t, $options: 'i' } },
          { title: { $regex: t, $options: 'i' } },
          { description: { $regex: t, $options: 'i' } },
          { genre: { $regex: t, $options: 'i' } },
          { cast: { $regex: t, $options: 'i' } },
          { director: { $regex: t, $options: 'i' } }
        ]
      }))
      const finalQuery = { ...query }
      delete finalQuery.$text
      delete finalQuery.$or
      finalQuery.$and = andClauses

      const res2 = await Promise.all([
        Content.countDocuments(finalQuery),
        Content.find(finalQuery)
          .sort(sortParam === 'recent' ? { createdAt: -1 } : (sortParam === 'rating' ? { rating: -1, createdAt: -1 } : (sortParam === 'year' ? { year: -1, createdAt: -1 } : { createdAt: -1 })))
          .limit(limit)
          .skip((page-1)*limit)
          .select({
            _id: 0,
            id: 1,
            type: 1,
            format: 1,
            title: 1,
            year: 1,
            poster: 1,
            rating: 1,
            genre: 1,
            createdAt: 1
          })
      ])
      total = res2[0]
      results = res2[1]
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  console.log('[SEARCH] final total', total, 'first ids', (results||[]).slice(0,3).map(r=>r.id))

  return Response.json({
    results,
    page,
    pageSize: limit,
    total,
    totalPages,
    sort: sortParam,
    query: { q: q || '', type, format, genre, yearFrom, yearTo, minRating }
  })
}


