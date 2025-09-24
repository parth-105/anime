import mongoose from 'mongoose'
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

export async function GET(req, { params }){
  await db()
  const { id } = params
  const doc = await Content.findOne({ id })
  if(!doc) return Response.json({ error: 'Not found' }, { status: 404 })
  // Return full document for debugging purposes
  return Response.json({
    id: doc.id,
    type: doc.type,
    format: doc.format,
    title: doc.title,
    year: doc.year,
    rating: doc.rating,
    genre: doc.genre,
    cast: doc.cast,
    director: doc.director,
    description: doc.description,
    poster: doc.poster,
    createdAt: doc.createdAt,
    hasSources: Array.isArray(doc.sources) && doc.sources.length > 0,
    hasSeasons: Array.isArray(doc.seasons) && doc.seasons.length > 0,
    raw: doc
  })
}


