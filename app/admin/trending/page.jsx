'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getToken } from '@/app/lib/adminClient'

export default function AdminTrending(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newId, setNewId] = useState('')
  const [newRank, setNewRank] = useState(1)
  const token = getToken()

  const load = async () => {
    setLoading(true); setError('')
    try{
      const res = await fetch('/api/trending', { cache: 'no-store' })
      if(!res.ok) throw new Error('Failed to load trending')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    }catch(ex){ setError(ex.message) }
    finally{ setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const setRank = async (id, rank) => {
    try{
      const token = getToken()
      const res = await fetch('/api/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: (id||'').trim(), rank })
      })
      if(!res.ok) throw new Error('Failed to update rank')
      await load()
    }catch(ex){ alert(ex.message) }
  }

  const remove = async (id) => {
    try{
      const token = getToken()
      const res = await fetch(`/api/trending?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if(!res.ok) throw new Error('Failed to remove trending')
      await load()
    }catch(ex){ alert(ex.message) }
  }

  return (
    <div className="container-xl page-px page-py space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Manage Trending (max 20)</h1>
        <Link href="/admin" className="underline text-blue-300">Back to Admin</Link>
      </div>

      {!token && (
        <div className="glass-panel rounded-2xl card-pad">
          <div className="text-sm">Please <Link href="/admin/login" className="underline text-blue-300">login</Link> as admin to manage trending.</div>
        </div>
      )}

      <div className="glass-panel rounded-2xl card-pad">
        <div className="mb-4">
          <div className="text-white/80 font-semibold mb-2">Add/Update by ID or Slug</div>
          <div className="flex flex-wrap items-center gap-2">
            <input value={newId} onChange={e=>setNewId(e.target.value)} placeholder="Enter id or slug" className="flex-1 min-w-[220px] h-10 rounded bg-white/10 border border-white/15 px-3" disabled={!token} />
            <input type="number" min={1} max={20} value={newRank} onChange={e=>setNewRank(Number(e.target.value)||1)} className="w-24 h-10 rounded bg-white/10 border border-white/15 px-2" disabled={!token} />
            <button onClick={() => setRank(newId, newRank)} className="control-btn" disabled={!token}>Set Rank</button>
          </div>
          <div className="text-white/50 text-xs mt-1">Tip: Use the content's id or slug. 1 is highest.</div>
        </div>

        {loading && <div>Loading…</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="space-y-3">
          {items.length === 0 && !loading && (
            <div className="text-white/60 text-sm">No trending items yet.</div>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
              <img src={item.poster} alt="" className="w-14 h-20 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{item.title}</div>
                <div className="text-white/60 text-xs">Current rank: {item.trendingRank}</div>
              </div>
              <input type="number" min={1} max={20} defaultValue={item.trendingRank} className="w-20 h-10 rounded bg-white/10 border border-white/15 px-2" id={`rank-${item.id}`} />
              <button onClick={() => setRank(item.id, Number(document.getElementById(`rank-${item.id}`).value)||1)} className="control-btn">Update</button>
              <button onClick={() => remove(item.id)} className="control-btn">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


