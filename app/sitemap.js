import mongoose from 'mongoose'
export const dynamic = 'force-dynamic'
export const revalidate = 0
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

export default async function sitemap(){
  await db()
  const base = 'https://neonflix.com'
  const items = []
  
  // Add home page
  items.push({
    url: base,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 1.0
  })
  
  // Exclude admin and test from sitemap
  
  // Add content from DB using slug or id
  const docs = await Content.find({}, { _id: 0, id: 1, slug: 1, type: 1, seasons: 1, createdAt: 1 }).limit(5000)
  for(const item of docs){
    const key = item.slug || item.id
    if(item.type === 'movie' || !Array.isArray(item.seasons) || item.seasons.length === 0){
      items.push({
        url: `${base}/watch/${item.type}/${key}`,
        lastModified: (item.createdAt || new Date()).toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8
      })
    }else{
      for(const s of item.seasons || []){
        for(const e of (s.episodes || [])){
          items.push({
            url: `${base}/watch/${item.type}/${key}/${s.season}/${e.id}`,
            lastModified: (item.createdAt || new Date()).toISOString(),
            changeFrequency: 'weekly',
            priority: 0.7
          })
        }
      }
    }
  }
  
  return items
}


