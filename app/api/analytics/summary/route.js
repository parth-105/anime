import mongoose from 'mongoose'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import AnalyticsEvent from '@/app/models/AnalyticsEvent'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neonflix'
let cached = global._neonflix_mongoose
if(!cached){ cached = global._neonflix_mongoose = { conn: null, promise: null } }

async function db(){
  if(cached.conn) return cached.conn
  if(!cached.promise){ cached.promise = mongoose.connect(MONGO_URI, { autoIndex:false }).then(m=>m) }
  cached.conn = await cached.promise
  return cached.conn
}

export async function GET(req){
  await db()
  const { searchParams } = new URL(req.url)
  const days = Math.max(1, Math.min(365, Number(searchParams.get('days')||7)))
  const since = new Date(Date.now() - days*24*60*60*1000)

  const [visits, geo, categories] = await Promise.all([
    AnalyticsEvent.countDocuments({ type: 'pageview', ts: { $gte: since } }),
    AnalyticsEvent.aggregate([
      { $match: { type: 'pageview', ts: { $gte: since } } },
      { $group: { _id: { country: '$geo.country', region: '$geo.region', city: '$geo.city' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]),
    AnalyticsEvent.aggregate([
      { $match: { type: 'pageview', ts: { $gte: since }, 'content.type': { $exists: true } } },
      { $group: { _id: '$content.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ])

  return Response.json({ visits, geo, categories, since })
}


