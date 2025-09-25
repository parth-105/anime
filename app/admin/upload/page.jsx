'use client'
import { useState } from 'react'
import { createContent, getToken } from '@/app/lib/adminClient'
import Link from 'next/link'

export default function AdminUpload(){
  const [type, setType] = useState('movie')
  const [format, setFormat] = useState('movie')
  const [form, setForm] = useState({ id:'', title:'', year:new Date().getFullYear(), description:'', poster:'', duration:'', rating:'', genre:'', cast:'', director:'', language:'English', country:'' })
  const [sources, setSources] = useState([{ quality:'hls_master', src:'', subtitles:'' }])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [seasons, setSeasons] = useState([{ season: 1, episodes: [{ id:'', title:'', duration:'', src:'', subtitles:'' }] }])
  const [result, setResult] = useState(null)
  const [trending, setTrending] = useState({ enabled: false, rank: 1 })
  const [err, setErr] = useState('')

  if(!getToken()){
    return (
      <div className="container-xl page-px page-py">
        <div className="glass-panel rounded-2xl card-pad">Please <Link href="/admin/login" className="underline text-blue-300">login</Link> as admin.</div>
      </div>
    )
  }

  const submit = async (e) =>{
    e.preventDefault()
    setErr(''); setResult(null)
    try{
      const isEpisodic = !(type === 'movie' || (type === 'anime' && format === 'movie'))
      const content = {
        ...form,
        type,
        format: type==='anime' ? format : undefined,
        year: Number(form.year),
        duration: form.duration ? Number(form.duration) : undefined,
        rating: form.rating ? Number(form.rating) : undefined,
        genre: form.genre ? form.genre.split(',').map(g=>g.trim()) : [],
        cast: form.cast ? form.cast.split(',').map(c=>c.trim()) : [],
        sources: !isEpisodic ? sources.filter(s=>s.src).map(s=>({
          quality: s.quality || 'hls_master',
          src: s.src,
          subtitles: (s.subtitles||'').split('\n').map(line=>line.trim()).filter(Boolean).map(row=>{ const [lang,label,src] = row.split('|'); return { lang, label, src } })
        })) : undefined,
        embedUrl: youtubeUrl ? toYouTubeEmbed(youtubeUrl) : undefined,
        seasons: isEpisodic ? seasons.map(se => ({
          season: Number(se.season) || 1,
          episodes: (se.episodes||[]).filter(ep=>ep.src).map(ep => ({
            id: ep.id || `${form.id}-s${se.season}-e${(se.episodes||[]).indexOf(ep)+1}`,
            title: ep.title || `Episode ${(se.episodes||[]).indexOf(ep)+1}`,
            duration: ep.duration ? Number(ep.duration) : undefined,
            src: ep.src,
            subtitles: (ep.subtitles||'').split('\n').map(l=>l.trim()).filter(Boolean).map(row=>{ const [lang,label,src] = row.split('|'); return { lang, label, src } })
          }))
        })) : undefined
      }
      const res = await createContent(content)
      setResult(res)
      // If trending requested, set rank
      if(trending.enabled && res?.id){
        const token = getToken()
        const trRes = await fetch('/api/trending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id: res.id, rank: trending.rank })
        })
        if(!trRes.ok){
          const detail = await trRes.json().catch(()=>({}))
          setErr(`Trending update failed: ${detail.error || trRes.statusText}`)
        }
      }
    }catch(ex){ setErr(ex.message) }
  }

  const updateSource = (idx, patch) => {
    setSources(prev => prev.map((s,i)=> i===idx ? { ...s, ...patch } : s))
  }

  const addSource = () => setSources(prev => [...prev, { quality:'hls_master', src:'', subtitles:'' }])
  const addSeason = () => setSeasons(prev => [...prev, { season: (prev.at(-1)?.season||0)+1, episodes: [{ id:'', title:'', duration:'', src:'', subtitles:'' }] }])
  const addEpisode = (sIndex) => setSeasons(prev => prev.map((s,i)=> i===sIndex ? { ...s, episodes: [...s.episodes, { id:'', title:'', duration:'', src:'', subtitles:'' }] } : s))
  const updateSeason = (sIndex, patch) => setSeasons(prev => prev.map((s,i)=> i===sIndex ? { ...s, ...patch } : s))
  const updateEpisode = (sIndex, eIndex, patch) => setSeasons(prev => prev.map((s,i)=> i===sIndex ? { ...s, episodes: s.episodes.map((ep,j)=> j===eIndex ? { ...ep, ...patch } : ep) } : s))

  const toYouTubeEmbed = (url) => {
    try{
      const u = new URL(url)
      if(u.hostname.includes('youtu.be')){
        return `https://www.youtube.com/embed/${u.pathname.replace('/','')}?rel=0&modestbranding=1`
      }
      if(u.hostname.includes('youtube.com')){
        const id = u.searchParams.get('v')
        if(id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
      }
    }catch{}
    return ''
  }

  return (
    <div className="container-xl page-px page-py">
      <div className="glass-panel rounded-2xl card-pad space-y-4">
        <h1 className="text-xl font-bold">Upload Content</h1>
        {err && <div className="bg-red-500/20 border border-red-500/40 p-2 rounded text-sm">{err}</div>}
        {result && <div className="bg-green-500/20 border border-green-500/40 p-2 rounded text-sm">Created: {result.title}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={type} onChange={e=>setType(e.target.value)} className="select pl-4 pr-10">
              <option value="movie">Movie</option>
              <option value="series">Series</option>
              <option value="webseries">Web Series</option>
              <option value="kdrama">K-Drama</option>
              <option value="anime">Anime</option>
              <option value="drama">Drama</option>
              <option value="documentary">Documentary</option>
              <option value="reality">Reality</option>
              <option value="comedy">Comedy</option>
            </select>
            {type==='anime' && (
              <select value={format} onChange={e=>setFormat(e.target.value)} className="select pl-4 pr-10">
                <option value="movie">Anime Movie</option>
                <option value="series">Anime Series</option>
              </select>
            )}
            <input className="flex-1 min-w-[220px] h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Slug ID (e.g. avatar3)" value={form.id} onChange={e=>setForm({...form, id:e.target.value})} />
            <input className="flex-1 min-w-[260px] h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 rail-gap">
          {/* Trending controls */}
          <div className="glass-panel rounded-2xl card-pad">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={trending.enabled} onChange={e=>setTrending(prev=>({ ...prev, enabled: e.target.checked }))} />
                <span>Mark as Trending</span>
              </label>
              {trending.enabled && (
                <div className="flex items-center gap-2">
                  <span>Rank</span>
                  <input type="number" min={1} max={20} value={trending.rank} onChange={e=>setTrending(prev=>({ ...prev, rank: Number(e.target.value)||1 }))} className="w-20 h-10 rounded bg-white/10 border border-white/15 px-2" />
                  <span className="text-white/60 text-sm">(1 is highest, max 20)</span>
                </div>
              )}
            </div>
            {trending.enabled && (
              <p className="text-white/60 text-xs mt-2">If the rank is already used, existing items shift down; the 20th drops off.</p>
            )}
          </div>
            <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Year" value={form.year} onChange={e=>setForm({...form, year:e.target.value})} />
            <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Duration (sec)" value={form.duration} onChange={e=>setForm({...form, duration:e.target.value})} />
            <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Rating (e.g. 8.5)" value={form.rating} onChange={e=>setForm({...form, rating:e.target.value})} />
          </div>

          <input className="w-full h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Poster URL" value={form.poster} onChange={e=>setForm({...form, poster:e.target.value})} />
          <div className="grid grid-cols-1 md:grid-cols-3 rail-gap items-end">
            <input className="md:col-span-2 h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Paste YouTube URL to import title & thumbnail" value={youtubeUrl} onChange={e=>setYoutubeUrl(e.target.value)} />
            <button type="button" className="h-11 rounded-lg bg-white/10 border border-white/15 px-3 hover-glow" onClick={async()=>{
              if(!youtubeUrl) return
              try{
                const res = await fetch(`/api/import/youtube?url=${encodeURIComponent(youtubeUrl)}`)
                const data = await res.json()
                if(data.title){ setForm(f=>({ ...f, title: f.title||data.title, poster: f.poster||data.thumbnail })) }
              }catch{}
            }}>Fetch from YouTube</button>
          </div>
          <textarea rows={3} className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />

          <div className="grid grid-cols-1 md:grid-cols-2 rail-gap">
            <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Genres (comma separated)" value={form.genre} onChange={e=>setForm({...form, genre:e.target.value})} />
            <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Cast (comma separated)" value={form.cast} onChange={e=>setForm({...form, cast:e.target.value})} />
            <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Director" value={form.director} onChange={e=>setForm({...form, director:e.target.value})} />
            <div className="grid grid-cols-2 rail-gap">
              <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Language" value={form.language} onChange={e=>setForm({...form, language:e.target.value})} />
              <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Country" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} />
            </div>
          </div>

          {type === 'movie' ? (
            <div className="space-y-3">
              <h3 className="text-sm tracking-widest text-white/80">SOURCES</h3>
              {sources.map((s, i) => (
                <div key={i} className="glass-panel rounded-xl card-pad space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 rail-gap">
                    <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Quality (e.g. hls_master)" value={s.quality} onChange={e=>updateSource(i,{quality:e.target.value})} />
                    <input className="md:col-span-2 h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="HLS URL" value={s.src} onChange={e=>updateSource(i,{src:e.target.value})} />
                  </div>
                  <textarea rows={3} className="w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2" placeholder="Subtitles (one per line: lang|label|url)" value={s.subtitles} onChange={e=>updateSource(i,{subtitles:e.target.value})} />
                </div>
              ))}
              <button type="button" className="pill hover-glow" onClick={addSource}>+ Add Source</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm tracking-widest text-white/80">SEASONS & EPISODES</h3>
                <button type="button" className="pill hover-glow" onClick={addSeason}>+ Add Season</button>
              </div>
              {seasons.map((s, si) => (
                <div key={si} className="glass-panel rounded-xl card-pad space-y-3">
                  <div className="flex items-center gap-3">
                    <input className="h-11 w-32 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Season #" value={s.season} onChange={e=>updateSeason(si,{season:e.target.value})} />
                    <button type="button" className="pill hover-glow" onClick={()=>addEpisode(si)}>+ Add Episode</button>
                  </div>
                  <div className="space-y-3">
                    {s.episodes.map((ep, ei) => (
                      <div key={ei} className="grid grid-cols-1 md:grid-cols-3 rail-gap">
                        <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Episode ID" value={ep.id} onChange={e=>updateEpisode(si, ei, { id:e.target.value })} />
                        <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Episode Title" value={ep.title} onChange={e=>updateEpisode(si, ei, { title:e.target.value })} />
                        <input className="h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Duration (sec)" value={ep.duration} onChange={e=>updateEpisode(si, ei, { duration:e.target.value })} />
                        <input className="md:col-span-3 h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Episode HLS URL" value={ep.src} onChange={e=>updateEpisode(si, ei, { src:e.target.value })} />
                        <textarea rows={3} className="md:col-span-3 rounded-lg bg-white/10 border border-white/15 px-3 py-2" placeholder="Episode Subtitles (one per line: lang|label|url)" value={ep.subtitles} onChange={e=>updateEpisode(si, ei, { subtitles:e.target.value })} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="px-5 h-11 rounded-lg bg-blue-600 hover:bg-blue-700">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}


