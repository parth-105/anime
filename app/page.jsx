import Link from 'next/link'
import Image from 'next/image'
import { contentTypes } from '@/app/data/movies'
import { fetchContent } from '@/app/lib/contentService'
import ContinueWatching from '@/app/components/ContinueWatching'
import ContentCard from '@/app/components/ContentCard'
import ContentRail from '@/app/components/ContentRail'

export default async function Home(){
  return (
    <div className="min-h-screen bg-cinemalux">
      <div className="container-xl page-px page-py section-gap">
        {/* Main heading */}
        <h1 className="sr-only">DramaDrift - Watch Movies, Series, Anime Online Free</h1>
        
        {/* Top nav pills */}
        <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(contentTypes).slice(0,5).map(([key, type]) => (
            <Link key={key} href={`/category/${key}`} className="pill hover-glow">
              {type.name}
            </Link>
          ))}
        </div>

        {/* Search + user glass bar */}
        <Link href="/search" className="glass-panel rounded-2xl card-pad flex items-center justify-between hover:brightness-110 hover-glow">
          <div className="flex-1">
            <div className="h-11 rounded-full bg-white/5 border border-white/10 flex items-center px-4 text-white/60">
              Search titles, genres, people…
            </div>
          </div>
          <div className="ml-4 w-11 h-11 rounded-xl bg-white/10 border border-white/10 grid place-items-center">🔍</div>
          <div className="ml-2 w-11 h-11 rounded-xl bg-white/10 border border-white/10 grid place-items-center">👤</div>
        </Link>

        {/* Removed duplicate hero-style continue watching section */}

        {/* Continue Watching rail */}
        <div className="glass-panel rounded-3xl card-pad section-gap">
          <div className="flex items-center justify-between">
            <h3 className="text-sm tracking-widest text-white/80">CONTINUE WATCHING</h3>
          </div>
          <ContinueWatching />
        </div>

        {/* Curated rails (lazy loaded when in view) */}
        <ContentRail title="Trending Now" icon="🔥" source="trending" initialLimit={20} />
        <ContentRail title="Top Rated" icon="⭐" query={{ sort: 'rating' }} initialLimit={20} />
        <ContentRail title="Latest Movies" icon="🎬" query={{ type: 'movie', sort: 'recent' }} initialLimit={12} />
        <ContentRail title="New Series" icon="📺" query={{ type: 'series', sort: 'recent' }} initialLimit={12} />
        <ContentRail title="Anime Picks" icon="🍥" query={{ type: 'anime', sort: 'recent' }} initialLimit={12} />
      </div>
    </div>
  )
}