import mongoose from 'mongoose'
import Content from '@/app/models/Content'
import sanitizeHtml from 'sanitize-html'

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
  // Support lookup by id or slug for backward compatibility
  const doc = await Content.findOne({ $or: [ { id: params.id }, { slug: params.id } ] })
  if(!doc) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(doc)
}

export async function PUT(req, { params }){
  await db()
  const data = await req.json()
  if(data.description) data.description = sanitizeHtml(data.description, { allowedTags: [], allowedAttributes: {} })
  const doc = await Content.findOneAndUpdate({ id: params.id }, data, { new: true })
  return Response.json(doc)
}

export async function DELETE(req, { params }){
  await db()
  await Content.deleteOne({ id: params.id })
  return Response.json({ ok: true })
}


