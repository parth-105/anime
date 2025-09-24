'use client'
import React from 'react'
import Link from 'next/link'

export default function SeasonEpisodes({ item, activeSeasonNumber, activeEpisodeId }){
  const [seasonNumber, setSeasonNumber] = React.useState(Number(activeSeasonNumber) || item?.seasons?.[0]?.season || 1)
  const seasons = item?.seasons || []
  const season = seasons.find(s => Number(s.season) === Number(seasonNumber)) || seasons[0]

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm tracking-widest text-white/80">EPISODES</h3>
        <div className="relative w-fit">
          <select
            className="select pl-4 pr-10"
            value={seasonNumber}
            onChange={(e)=>setSeasonNumber(Number(e.target.value))}
          >
            {seasons.map(s => (
              <option key={s.season} value={s.season} className="bg-[#0b0612] text-white">Season {s.season}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {season?.episodes?.map(ep => (
          <Link
            key={ep.id}
            href={`/watch/series/${item.id}/${season.season}/${ep.id}`}
            className={`group flex gap-3 p-3 rounded-xl bg-white/5 border ${ep.id===activeEpisodeId? 'border-blue-400' : 'border-white/10'} hover:border-blue-300 hover-glow`}
          >
            <div className="w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
              <img src={item.poster} alt={`${item.title} poster`} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{ep.title || ep.id}</div>
              <div className="text-xs text-gray-400 mt-1 truncate">{ep.description || 'Episode description'}</div>
              {ep.duration && (
                <div className="text-[11px] text-gray-500 mt-1">{Math.floor(ep.duration/60)}m {ep.duration%60}s</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}


