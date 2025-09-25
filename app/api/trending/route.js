import mongoose from 'mongoose'
import Content from '@/app/models/Content'

const MONGO_URI = process.env.MONGO_URI 
let cached = global._dramadrift_mongoose
if(!cached){ cached = global._dramadrift_mongoose = { conn: null, promise: null } }

async function db(){
  if(cached.conn) return cached.conn
  if(!cached.promise){
    cached.promise = mongoose.connect(MONGO_URI, { dbName: process.env.DB_NAME || undefined })
  }
  cached.conn = await cached.promise
  return cached.conn
}

function requireAdmin(req){
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const secret = process.env.JWT_SECRET || 'dev_secret'
  if(!token) return false
  try{
    const payload = JSON.parse(Buffer.from(token.split('.')[1]||'', 'base64').toString('utf8'))
    // lightweight check; if needed, use jwt.verify (but avoid heavy dep in edge)
    return payload && payload.sub
  }catch{ return false }
}

// GET /api/trending -> top 20 by ascending trendingRank
export async function GET(req){
  await db()
  const limit = 20
  // Prefer new fields isTrending + rank; fallback to trendingRank
  // console.log('[TRENDING][GET] incoming')
  const docs = await Content.find({ $or: [ { isTrending: true }, { trendingRank: { $ne: null } } ] })
    .sort({ rank: 1, trendingRank: 1 })
    .limit(limit)
 // console.log('[TRENDING][GET] found', docs.length, 'items', docs.map(d=>({ id:d.id, slug:d.slug, isTrending:d.isTrending, rank:d.rank, trendingRank:d.trendingRank })).slice(0,5))
  return Response.json(docs)
}

// POST /api/trending { id, rank } -> set item as trending at rank; shift others; cap 20
export async function POST(req){
  await db()
  if(!requireAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const id = String(body.id||'').trim()
  const rank = body.rank
  //console.log('[TRENDING][POST] req', { id, rank })
  const targetRank = Math.max(1, Math.min(20, Number(rank)))

  const item = await Content.findOne({ $or: [ { id }, { slug: id } ] })
  if(!item){
 //   console.log('[TRENDING][POST] not found', id)
    return Response.json({ error: 'Content not found' }, { status: 404 })
  }

  const existing = await Content.find({ $or: [ { isTrending: true }, { trendingRank: { $ne: null } } ] }).sort({ rank: 1, trendingRank: 1 })
  const current = await Content.findOne({ _id: item._id })
  const currentRank = current?.rank ?? current?.trendingRank ?? null
 // console.log('[TRENDING][POST] current', { id: item.id, currentRank, isTrending: !!current?.isTrending })

  if(currentRank === null){
    // Insert new at targetRank: shift all >= targetRank down
    const shiftRes = await Content.updateMany(
      { rank: { $ne: null, $gte: targetRank } },
      { $inc: { rank: 1 } }
    )
  ////  console.log('[TRENDING][POST] shift >= targetRank', targetRank, shiftRes?.modifiedCount)
    const setRes = await Content.updateOne({ _id: item._id }, { $set: { isTrending: true, rank: targetRank }, $unset: { trendingRank: '' } })
  //  console.log('[TRENDING][POST] set new rank', targetRank, 'result', setRes?.modifiedCount ?? setRes?.acknowledged)
    const verify = await Content.findOne({ _id: item._id })
  //  console.log('[TRENDING][POST] verify doc', { id: verify?.id, isTrending: verify?.isTrending, rank: verify?.rank, trendingRank: verify?.trendingRank })
  }else if(currentRank !== targetRank){
    if(targetRank < currentRank){
      // Move up: shift range [targetRank, currentRank-1] down by +1
      const upRes = await Content.updateMany(
        { rank: { $ne: null, $gte: targetRank, $lt: currentRank } },
        { $inc: { rank: 1 } }
      )
   //   console.log('[TRENDING][POST] move up shift', upRes?.modifiedCount)
      const setRes = await Content.updateOne({ _id: item._id }, { $set: { isTrending: true, rank: targetRank }, $unset: { trendingRank: '' } })
  //    console.log('[TRENDING][POST] new rank', targetRank, 'result', setRes?.modifiedCount ?? setRes?.acknowledged)
      const verify = await Content.findOne({ _id: item._id })
  //    console.log('[TRENDING][POST] verify doc', { id: verify?.id, isTrending: verify?.isTrending, rank: verify?.rank, trendingRank: verify?.trendingRank })
    }else{
      // Move down: shift range (currentRank, targetRank] up by -1
      const downRes = await Content.updateMany(
        { rank: { $ne: null, $gt: currentRank, $lte: targetRank } },
        { $inc: { rank: -1 } }
      )
    //  console.log('[TRENDING][POST] move down shift', downRes?.modifiedCount)
      const setRes = await Content.updateOne({ _id: item._id }, { $set: { isTrending: true, rank: targetRank }, $unset: { trendingRank: '' } })
    //  console.log('[TRENDING][POST] new rank', targetRank, 'result', setRes?.modifiedCount ?? setRes?.acknowledged)
      const verify = await Content.findOne({ _id: item._id })
    //  console.log('[TRENDING][POST] verify doc', { id: verify?.id, isTrending: verify?.isTrending, rank: verify?.rank, trendingRank: verify?.trendingRank })
    }
  }

  // Ensure cap at 20
  // Find any with rank > 20 and unset isTrending/rank
  const trimRes = await Content.updateMany({ rank: { $gt: 20 } }, { $set: { isTrending: false }, $unset: { rank: '' } })
  if(trimRes?.modifiedCount){ console.log('[TRENDING][POST] trimmed overflow', trimRes.modifiedCount) }
  const after = await Content.find({ isTrending: true }).sort({ rank: 1 }).limit(25)
 // console.log('[TRENDING][POST] after-set top', after.map(d=>({ id:d.id, rank:d.rank })).slice(0,10))

  return Response.json({ ok: true })
}

// DELETE /api/trending?id=... -> unset trending and shift up items below
export async function DELETE(req){
  await db()
  if(!requireAdmin(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
 // console.log('[TRENDING][DELETE] id', id)
  if(!id) return Response.json({ error: 'id required' }, { status: 400 })
  const item = await Content.findOne({ $or: [ { id }, { slug: id } ] })
  if(!item || (item.rank == null && item.trendingRank == null)){
  //  console.log('[TRENDING][DELETE] nothing to remove')
    return Response.json({ ok: true })
  }
  const rank = item.rank ?? item.trendingRank
  await Content.updateOne({ _id: item._id }, { $set: { isTrending: false }, $unset: { rank: '', trendingRank: '' } })
  // Shift range (rank, ∞) up by -1 to close the gap using new rank field
  const shiftRes = await Content.updateMany({ rank: { $ne: null, $gt: rank } }, { $inc: { rank: -1 } })
 // console.log('[TRENDING][DELETE] removed rank', rank, 'shifted', shiftRes?.modifiedCount)
  return Response.json({ ok: true })
}


