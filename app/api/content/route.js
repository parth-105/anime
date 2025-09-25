import mongoose from 'mongoose'
import Content from '@/app/models/Content'
import sanitizeHtml from 'sanitize-html'
import slugify from 'slugify'

const MONGO_URI = process.env.MONGO_URI 
let cached = global._dramadrift_mongoose
if(!cached){ cached = global._dramadrift_mongoose = { conn: null, promise: null } }

async function db(){
  if(cached.conn) return cached.conn
  if(!cached.promise){ cached.promise = mongoose.connect(MONGO_URI, { autoIndex:false }).then(m=>m) }
  cached.conn = await cached.promise
  return cached.conn
}

export async function GET(req){
  await db()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type')
  const format = searchParams.get('format')
  const genre = searchParams.get('genre')
  const sort = searchParams.get('sort')
  const limit = Math.min(Number(searchParams.get('limit')||24), 60)
  const page = Number(searchParams.get('page')||1)
  const query = {}
  if(type) query.type = type
  if(format) query.format = format
  if(genre) query.genre = genre
  if(q) query.$text = { $search: q }
  let sortSpec = { createdAt: -1 }
  if(q){ sortSpec = { score: { $meta: 'textScore' } } }
  else if(sort === 'rating'){ sortSpec = { rating: -1, createdAt: -1 } }
  else if(sort === 'recent'){ sortSpec = { createdAt: -1 } }
  else if(sort === 'year'){ sortSpec = { year: -1, createdAt: -1 } }
  const docs = await Content.find(query)
    .sort(sortSpec)
    .limit(limit)
    .skip((page-1)*limit)
  return Response.json(docs)
}

export async function POST(req){
  await db()
  // Optional: add auth using headers (skipped for brevity)
  const data = await req.json()
  if(data.description) data.description = sanitizeHtml(data.description, { allowedTags: [], allowedAttributes: {} })
  // Ensure embedUrl is a string if provided
  if(data.embedUrl && typeof data.embedUrl !== 'string') data.embedUrl = String(data.embedUrl)
  // Generate slug if missing
  if(!data.slug){
    const base = data.title || data.id
    if(base){
      data.slug = slugify(String(base), { lower: true, strict: true, remove: /[*+~.()'"!:@]/g })
    }
  }
  const doc = await Content.create(data)
  return Response.json(doc, { status: 201 })
}


