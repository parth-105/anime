'use client'
import React, { useState } from 'react'

export default function Admin(){
  const [form, setForm] = useState({ 
    id:'', 
    title:'', 
    type:'movie', 
    poster:'', 
    hlsUrl:'', 
    subtitles:'',
    year: new Date().getFullYear(),
    duration: '',
    genre: '',
    description: '',
    rating: '',
    cast: '',
    director: '',
    country: '',
    language: 'English'
  })
  const [output, setOutput] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    // parse subtitles CSV: lang|label|url per line
    const subtitleFiles = form.subtitles.split('\n').map(l=>l.trim()).filter(Boolean).map(row=>{
      const [language,label,url] = row.split('|')
      return { language, url, label }
    })

    // Build media object for AI prompt
    const media = {
      id: form.id,
      title: form.title,
      type: form.type,
      year: parseInt(form.year) || new Date().getFullYear(),
      duration: parseInt(form.duration) || null,
      rating: parseFloat(form.rating) || 0,
      description: form.description || `Watch ${form.title} online free in HD quality.`,
      cast: form.cast ? form.cast.split(',').map(c => c.trim()) : [], 
      director: form.director ? [form.director] : [], 
      genres: form.genre ? form.genre.split(',').map(g => g.trim()) : [], 
      country: form.country || 'Unknown',
      language: form.language || 'English',
      keywords: `${form.title}, watch online, free streaming, ${form.type}, ${form.genre}`.split(',').map(k => k.trim()),
      posterUrl: form.poster,
      hlsUrl: form.hlsUrl,
      subtitleFiles
    }

    // Transcript via API route
    const tr = await fetch('/api/transcript', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ subtitleFiles }) }).then(r=>r.json()).catch(()=>({transcript:null}))

    setOutput({ media, transcript: tr.transcript })
  }

  return (
    <div className="max-w-5xl space-y-8">
      <section className="glass-panel rounded-2xl card-pad">
        <h2 className="text-xl mb-3">Site Analytics</h2>
        <AnalyticsTabs />
      </section>
      <section>
        {/* <h2 className="text-xl mb-4">Admin — Add Title</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="slug id (e.g. xyz-3)" value={form.id} onChange={e=>setForm({...form, id:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Title (e.g. XYZ 3)" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Year (e.g. 2024)" type="number" value={form.year} onChange={e=>setForm({...form, year:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Duration in seconds (e.g. 5400)" type="number" value={form.duration} onChange={e=>setForm({...form, duration:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Genre (e.g. Action, Drama, Comedy)" value={form.genre} onChange={e=>setForm({...form, genre:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Rating (e.g. 8.5)" type="number" step="0.1" min="0" max="10" value={form.rating} onChange={e=>setForm({...form, rating:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Cast (e.g. Actor 1, Actor 2)" value={form.cast} onChange={e=>setForm({...form, cast:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Director" value={form.director} onChange={e=>setForm({...form, director:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Country (e.g. USA, South Korea)" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Language (e.g. English, Korean)" value={form.language} onChange={e=>setForm({...form, language:e.target.value})} />
        <textarea className="w-full p-2 bg-white/5 border rounded" rows="3" placeholder="Description (SEO-optimized)" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <select className="select w-full" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
          <option value="movie">🎬 Movie</option>
          <option value="series">📺 TV Series</option>
          <option value="webseries">💻 Web Series</option>
          <option value="kdrama">🇰🇷 K-Drama</option>
          <option value="anime">🎌 Anime</option>
          <option value="drama">🎭 Drama</option>
          <option value="documentary">📚 Documentary</option>
          <option value="reality">📹 Reality TV</option>
          <option value="comedy">😂 Comedy</option>
        </select>
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="Poster URL" value={form.poster} onChange={e=>setForm({...form, poster:e.target.value})} />
        <input className="w-full p-2 bg-white/5 border rounded" placeholder="HLS master URL" value={form.hlsUrl} onChange={e=>setForm({...form, hlsUrl:e.target.value})} />
        <textarea className="w-full p-2 bg-white/5 border rounded" rows="4" placeholder="Subtitles CSV rows: lang|label|url" value={form.subtitles} onChange={e=>setForm({...form, subtitles:e.target.value})} />
        <button className="control-btn" type="submit">Generate SEO & Transcript</button>
      </form> */}

      {output && (
        <div className="mt-6 space-y-3">
          <div className="card p-3 rounded">
            <div className="font-semibold mb-2">Media object</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(output.media, null, 2)}</pre>
          </div>
          <div className="card p-3 rounded">
            <div className="font-semibold mb-2">Transcript (merged)</div>
            <pre className="text-xs whitespace-pre-wrap">{output.transcript || 'None'}</pre>
          </div>
          <div className="text-sm opacity-80">Paste the media into your AI prompt to generate title/meta/JSON-LD, then add to your dataset. The sitemap updates automatically from the dataset.</div>
        </div>
      )}
      </section>
    </div>
  )
}

// Metadata export is not allowed in a client component. If needed,
// move metadata to a server layout for the admin segment.

function AnalyticsOverview(){
  const [range, setRange] = React.useState(7)
  const [data, setData] = React.useState(null)
  const [err, setErr] = React.useState(null)
  const ranges = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '3m', days: 90 },
    { label: '6m', days: 180 },
    { label: '1y', days: 365 }
  ]
  const load = async (d) => {
    setErr(null)
    setData(null)
    try{
      const res = await fetch(`/api/analytics/summary?days=${d}`)
      const json = await res.json()
      setData(json)
    }catch(e){ setErr('Failed to load analytics') }
  }
  React.useEffect(() => { load(range) }, [range])
  if(err){ return <div className="state-error">{err}</div> }
  if(!data){ return <div className="state-loading">Loading analytics…</div> }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {ranges.map(r => (
          <button key={r.days} onClick={()=>setRange(r.days)} className={`pill ${range===r.days?'bg-white/20':''}`}>{r.label}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
      <div className="glass-panel rounded-xl p-4">
        <div className="text-white/60 text-sm">Visits ({ranges.find(x=>x.days===range)?.label})</div>
        <div className="text-2xl font-bold">{data.visits}</div>
      </div>
      <div className="glass-panel rounded-xl p-4 md:col-span-2">
        <div className="text-white/60 text-sm mb-2">Top Categories</div>
        <div className="flex flex-wrap gap-2">
          {data.categories.map(c => (
            <div key={c._id} className="badge">{c._id}: {c.count}</div>
          ))}
        </div>
      </div>
      <div className="glass-panel rounded-xl p-4 md:col-span-3">
        <div className="text-white/60 text-sm mb-2">Top Locations</div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
          {data.geo.map((g,i) => (
            <div key={i} className="text-sm text-white/80">
              {(g._id.country||'Unknown')}, {(g._id.region||'')}, {(g._id.city||'')}: <span className="text-white">{g.count}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}

function VercelAnalyticsPanel(){
  return (
    <div className="text-sm text-white/80">
      <div className="mb-2">Vercel Analytics is enabled. View detailed charts in your Vercel project dashboard under Analytics.</div>
      <ul className="list-disc ml-5 space-y-1 text-white/70">
        <li>Pageviews & visitors</li>
        <li>Top pages & referrers</li>
        <li>Devices & countries</li>
        <li>Privacy-friendly (no cookies)</li>
      </ul>
      <div className="mt-3 text-white/60">Note: Free tier may sample data and limit historical retention.</div>
    </div>
  )
}

function AnalyticsTabs(){
  const [tab, setTab] = React.useState('personal')
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className={`pill ${tab==='personal'?'bg-white/20':''}`} onClick={()=>setTab('personal')}>Personal Analytics</button>
        <button className={`pill ${tab==='vercel'?'bg-white/20':''}`} onClick={()=>setTab('vercel')}>Vercel Analytics</button>
      </div>
      <div>
        {tab==='personal' ? <AnalyticsOverview /> : <VercelAnalyticsPanel />}
      </div>
    </div>
  )
}

