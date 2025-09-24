import mongoose from 'mongoose'
import AnalyticsEvent from '@/app/models/AnalyticsEvent'

const MONGO_URI = process.env.MONGO_URI 
let cached = global._neonflix_mongoose
if(!cached){ cached = global._neonflix_mongoose = { conn: null, promise: null } }

async function db(){
  if(cached.conn) return cached.conn
  if(!cached.promise){ cached.promise = mongoose.connect(MONGO_URI, { autoIndex:false }).then(m=>m) }
  cached.conn = await cached.promise
  return cached.conn
}

function getSessionId(req){
  const cookie = req.headers.get('cookie') || ''
  const m = cookie.match(/nf_sid=([^;]+)/)
  if(m) return m[1]
  // generate a new sid
  const sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
  return sid
}

export async function POST(req){
  await db()
  const { searchParams } = new URL(req.url)
  const body = await req.json().catch(()=>({}))
  const sid = getSessionId(req)

  // Basic anti-abuse: cap batch size
  const events = Array.isArray(body?.events) ? body.events.slice(0, 25) : []
  const ua = req.headers.get('user-agent') || ''
  const ref = req.headers.get('referer') || ''

  const docs = events.map(e => ({
    ts: e.ts ? new Date(e.ts) : new Date(),
    sid,
    aid: e.aid,
    type: e.type,
    path: e.path,
    ref,
    utm: e.utm,
    device: { ua, width: e.device?.w, height: e.device?.h },
    geo: e.geo || {},
    content: e.content || {},
    payload: e.payload || {}
  }))

  if(docs.length){ await AnalyticsEvent.insertMany(docs, { ordered: false }).catch(()=>{}) }

  // set session cookie if missing
  const headers = new Headers({ 'content-type': 'application/json' })
  if(!(req.headers.get('cookie')||'').includes('nf_sid=')){
    headers.append('set-cookie', `nf_sid=${sid}; Path=/; Max-Age=7776000; SameSite=Lax`)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}


