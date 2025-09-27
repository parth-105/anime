import mongoose from 'mongoose'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { headers } from 'next/headers'
import Content from '@/app/models/Content'

const MONGO_URI = process.env.MONGO_URI 
let cached = global._dramadrift_mongoose
if(!cached){ cached = global._dramadrift_mongoose = { conn: null, promise: null } }

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
  // Add cache control headers to prevent stale results
  const responseHeaders = new Headers({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  })
  
  // Debug: Log incoming request
  if(process.env.NODE_ENV !== 'production'){
    console.log('[SEARCH-API] Incoming request:', req.url)
  }
  
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
      return Response.json({ error: 'Rate limit exceeded' }, { status: 429, headers: responseHeaders })
    }
  }catch{}
  await db()
  const { searchParams } = new URL(req.url)
  //console.log('[SEARCH] url', req.url)

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

   // Build search component of the query with improved relevance
   let useText = false
   if(q){
     const safe = escapeRegex(q)
     const words = q.trim().split(/\s+/).filter(w => w.length > 0)
     
     // Create multiple search strategies with different relevance weights
     const searchStrategies = []
     
     // 1. Exact title match (highest priority)
     searchStrategies.push({
       title: { $regex: `^${safe}$`, $options: 'i' },
       _relevance: 1000
     })
     
     // 2. Title starts with query (high priority)
     searchStrategies.push({
       title: { $regex: `^${safe}`, $options: 'i' },
       _relevance: 900
     })
     
     // 3. Title contains all words (medium-high priority)
     if(words.length > 1) {
       const allWordsRegex = words.map(w => escapeRegex(w)).join('.*')
       searchStrategies.push({
         title: { $regex: allWordsRegex, $options: 'i' },
         _relevance: 800
       })
     }
     
     // 4. Title contains query (medium priority)
     searchStrategies.push({
       title: { $regex: safe, $options: 'i' },
       _relevance: 700
     })
     
     // 5. ID matches (medium priority)
     searchStrategies.push({
       id: { $regex: safe, $options: 'i' },
       _relevance: 600
     })
     
     // 6. Description contains query (lower priority)
     searchStrategies.push({
       description: { $regex: safe, $options: 'i' },
       _relevance: 500
     })
     
     // 7. Cast contains query (lower priority)
     searchStrategies.push({
       cast: { $regex: safe, $options: 'i' },
       _relevance: 400
     })
     
     // 8. Director contains query (lower priority)
     searchStrategies.push({
       director: { $regex: safe, $options: 'i' },
       _relevance: 300
     })
     
     // 9. Genre contains query (lower priority)
     searchStrategies.push({
       genre: { $regex: safe, $options: 'i' },
       _relevance: 200
     })
     
     // Use text search only if query is long enough and no other filters are present
     if(q.length >= 3 && !type && !format && !genre && typeof yearFrom === 'undefined' && typeof yearTo === 'undefined' && typeof minRating === 'undefined'){
       try {
         // Try text search first as a separate query
         const textQuery = { ...query, $text: { $search: q } }
         const textResults = await Content.find(textQuery).limit(limit).skip((page-1)*limit).select({
           _id: 0, id: 1, type: 1, format: 1, title: 1, year: 1, poster: 1, rating: 1, genre: 1, createdAt: 1
         })
         if(textResults.length > 0){
           const textTotal = await Content.countDocuments(textQuery)
           return Response.json({
             results: textResults,
             page,
             pageSize: limit,
             total: textTotal,
             totalPages: Math.max(1, Math.ceil(textTotal / limit)),
             sort: sortParam,
             query: { q: q || '', type, format, genre, yearFrom, yearTo, minRating }
           })
         }
       } catch(textError) {
         // If text search fails, fall back to regex
       //  console.log('Text search failed, using regex fallback:', textError?.message)
       }
     }
     
     // Use regex search with relevance scoring
     query.$or = searchStrategies.map(strategy => {
       const { _relevance, ...searchQuery } = strategy
       return searchQuery
     })
   }

  let sort = { createdAt: -1 }
  if(sortParam === 'relevance' && useText){
    sort = { score: { $meta: 'textScore' } }
  }else if(sortParam === 'relevance' && q){
    // For regex search, we need to implement custom relevance scoring
    // This will be handled in post-processing
    sort = { createdAt: -1 }
  }else if(sortParam === 'recent'){
    sort = { createdAt: -1 }
  }else if(sortParam === 'rating'){
    sort = { rating: -1, createdAt: -1 }
  }else if(sortParam === 'year'){
    sort = { year: -1, createdAt: -1 }
  }else if(q){
    // Default to relevance for search queries
    sort = { createdAt: -1 }
  }

  const projection = useText ? { score: { $meta: 'textScore' } } : undefined
  // console.log('[SEARCH] params', { q, type, format, genre, yearFrom, yearTo, minRating, sort: sortParam, page, limit })
  // console.log('[SEARCH] query', JSON.stringify(query))

   let total = 0
   let results = []
   try{
     // Debug: Log the query being executed
     if(process.env.NODE_ENV !== 'production'){
     //  console.log('[SEARCH] Executing query:', JSON.stringify(query))
       //console.log('[SEARCH] Projection:', projection)
     }
     
     ;[total, results] = await Promise.all([
       Content.countDocuments(query),
       Content.find(query, projection)
         .sort(sort)
         .limit(limit * 2) // Get more results for better relevance scoring
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
           createdAt: 1,
           description: 1,
           cast: 1,
           director: 1
         })
     ])
     
     // Debug: Log results immediately after database query
     if(process.env.NODE_ENV !== 'production'){
      //  console.log('[SEARCH] Database returned:', results.length, 'items')
      //  console.log('[SEARCH] First database result:', results[0])
      //  console.log('[SEARCH] Total documents in collection:', await Content.countDocuments({}))
     }
     
     // Convert Mongoose documents to plain objects
     results = results.map(item => item.toObject ? item.toObject() : item)
     
     // Debug: Log results after conversion
     if(process.env.NODE_ENV !== 'production'){
      //  console.log('[SEARCH] After conversion - First result:', results[0])
      //  console.log('[SEARCH] After conversion - Item keys:', results[0] ? Object.keys(results[0]) : 'no results')
     }
   }catch(err){
   //  console.error('Search error', err)
     return Response.json({ error: 'Search failed' }, { status: 500, headers: responseHeaders })
   }

   // Apply custom relevance scoring for regex searches
   if(q && !useText && results.length > 0){
     const queryLower = q.toLowerCase().trim()
     const words = queryLower.split(/\s+/).filter(w => w.length > 0)
     
     // Debug: Log raw results before processing
     if(process.env.NODE_ENV !== 'production'){
      //  console.log('[SEARCH] Raw results before processing:', results.length, 'items')
      //  console.log('[SEARCH] First raw item:', results[0])
     }
     
     results = results.map(item => {
       try {
         // Add error handling for malformed items
         if(!item || typeof item !== 'object') {
        //   console.warn('[SEARCH] Invalid item found:', item)
           return { ...item, _relevanceScore: 0 }
         }
         let relevanceScore = 0
         const titleLower = String(item.title || '').toLowerCase()
         const descriptionLower = String(item.description || '').toLowerCase()
         const castLower = Array.isArray(item.cast) ? item.cast.join(' ').toLowerCase() : String(item.cast || '').toLowerCase()
         const directorLower = String(item.director || '').toLowerCase()
         const genreLower = Array.isArray(item.genre) ? item.genre.join(' ').toLowerCase() : String(item.genre || '').toLowerCase()
         const idLower = String(item.id || '').toLowerCase()
       
       // Exact title match (highest priority)
       if(titleLower === queryLower) relevanceScore += 1000
       // Title starts with query (very high priority)
       else if(titleLower.startsWith(queryLower)) relevanceScore += 900
       // Title contains all words in order (high priority)
       else if(words.length > 1 && words.every(word => titleLower.includes(word))) {
         relevanceScore += 800
         // Bonus for words being close together
         const titleWords = titleLower.split(/\s+/)
         let wordPositions = words.map(word => titleWords.findIndex(w => w.includes(word))).filter(pos => pos >= 0)
         if(wordPositions.length === words.length) {
           const maxGap = Math.max(...wordPositions) - Math.min(...wordPositions)
           if(maxGap <= 3) relevanceScore += 100 // Words are close together
         }
       }
       // Title contains query (medium-high priority) - more user-friendly matching
       else if(titleLower.includes(queryLower)) {
         const queryLength = queryLower.length
         const titleLength = titleLower.length
         
         // For very short queries (2-3 chars), be very lenient for user convenience
         if(queryLength >= 2 && queryLength <= 3) {
           if((queryLength / titleLength) >= 0.1) { // Very low threshold
             relevanceScore += 600
           } else {
             relevanceScore += 400 // Still give some points for partial matches
           }
         }
         // For short queries (4-5 chars), moderate leniency
         else if(queryLength >= 4 && queryLength <= 5) {
           if((queryLength / titleLength) >= 0.2) {
             relevanceScore += 700
           } else if((queryLength / titleLength) >= 0.1) {
             relevanceScore += 500
           }
         }
         // For medium queries (6-8 chars), moderate proportion
         else if(queryLength >= 6 && queryLength <= 8) {
           if((queryLength / titleLength) >= 0.25) {
             relevanceScore += 700
           } else if((queryLength / titleLength) >= 0.12) {
             relevanceScore += 500
           }
         }
         // For longer queries (9+ chars), lower proportion needed
         else if(queryLength >= 9) {
           if((queryLength / titleLength) >= 0.2) {
             relevanceScore += 700
           } else if((queryLength / titleLength) >= 0.08) {
             relevanceScore += 500
           }
         }
       }
       // ID matches (medium priority)
       else if(idLower.includes(queryLower)) relevanceScore += 600
       // Description contains query (lower priority) - more lenient for user convenience
       else if(descriptionLower.includes(queryLower)) {
         if(queryLower.length >= 3) { // Lowered from 5 to 3
           relevanceScore += 500
         } else if(queryLower.length >= 2) {
           relevanceScore += 300 // Give some points for very short matches
         }
       }
       // Cast contains query (lower priority) - more lenient
       else if(castLower.includes(queryLower)) {
         if(queryLower.length >= 3) { // Lowered from 5 to 3
           relevanceScore += 400
         } else if(queryLower.length >= 2) {
           relevanceScore += 250
         }
       }
       // Director contains query (lower priority) - more lenient
       else if(directorLower.includes(queryLower)) {
         if(queryLower.length >= 3) { // Lowered from 5 to 3
           relevanceScore += 300
         } else if(queryLower.length >= 2) {
           relevanceScore += 200
         }
       }
       // Genre contains query (lowest priority) - more lenient
       else if(genreLower.includes(queryLower)) {
         if(queryLower.length >= 3) { // Lowered from 5 to 3
           relevanceScore += 200
         } else if(queryLower.length >= 2) {
           relevanceScore += 150
         }
       }
       
       // Special boost for very short queries to ensure they get results
       if(queryLower.length <= 4 && relevanceScore === 0) {
         // If no other matches found, give a small score for any partial match
         if(titleLower.includes(queryLower) || descriptionLower.includes(queryLower) || 
            castLower.includes(queryLower) || genreLower.includes(queryLower)) {
           relevanceScore += 200 // Minimum score for partial matches
         }
       }
       
       // Boost score for higher ratings
       if(item.rating && item.rating > 8) relevanceScore += 50
       else if(item.rating && item.rating > 7) relevanceScore += 25
       else if(item.rating && item.rating > 6) relevanceScore += 10
       
       // Penalty for very old content (unless it's highly relevant)
       const currentYear = new Date().getFullYear()
       if(item.year && item.year < currentYear - 10 && relevanceScore < 500) {
         relevanceScore = Math.max(0, relevanceScore - 100)
       }
       
       return { ...item, _relevanceScore: relevanceScore }
       } catch (itemError) {
       //  console.error('[SEARCH] Error processing item:', itemError, 'Item:', item)
         return { ...item, _relevanceScore: 0 }
       }
     })
     
     // Sort by relevance score (descending) then by rating, then by creation date
     results.sort((a, b) => {
       if(a._relevanceScore !== b._relevanceScore) {
         return b._relevanceScore - a._relevanceScore
       }
       if(a.rating !== b.rating) {
         return (b.rating || 0) - (a.rating || 0)
       }
       return new Date(b.createdAt) - new Date(a.createdAt)
     })
     
     // Update total count to match the actual number of results after relevance filtering
     // Lower threshold for more user-friendly partial matching (score > 50 for lenient filtering)
     const relevantResults = results.filter(item => item._relevanceScore > 50)
     
     // Debug: Log relevance scores and item structure
     if(process.env.NODE_ENV !== 'production'){
      //  console.log('[SEARCH] relevance scores:', results.map(item => ({ 
      //    title: item.title, 
      //    score: item._relevanceScore 
      //  })))
      //  console.log('[SEARCH] sample item structure:', results[0] ? Object.keys(results[0]) : 'no results')
      //  console.log('[SEARCH] sample item data:', results[0])
     }
     
     total = relevantResults.length
     
     // Limit to requested number of results
     results = relevantResults.slice(0, limit)
     
     // If we have no relevant results, return empty array
     if(relevantResults.length === 0) {
       results = []
       total = 0
     }
     
     // Remove the temporary relevance score from final results
     results = results.map(({ _relevanceScore, ...item }) => item)
   }

  // console.log('[SEARCH] initial total', total)

  const totalPages = Math.max(1, Math.ceil(total / limit))
  if(process.env.NODE_ENV !== 'production'){
    // eslint-disable-next-line no-console
    // console.log('[SEARCH] final total', total, 'results count', results.length, 'first results', (results||[]).slice(0,3).map(r=>({id: r.id, title: r.title, rating: r.rating})))
    // console.log('[SEARCH] query:', q, 'type:', type, 'sort:', sortParam)
    // console.log('[SEARCH] all results:', (results||[]).map(r=>({id: r.id, title: r.title, rating: r.rating})))
  }

  return Response.json({
    results,
    page,
    pageSize: limit,
    total,
    totalPages,
    sort: sortParam,
    query: { q: q || '', type, format, genre, yearFrom, yearTo, minRating },
    timestamp: Date.now()
  }, { headers: responseHeaders })
}


