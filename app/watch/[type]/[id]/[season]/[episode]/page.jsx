import EnhancedPlayer from '@/app/components/EnhancedPlayer'
import TranscriptSection from '@/app/components/TranscriptSection'
import RelatedContent from '@/app/components/RelatedContent'
import { library } from '@/app/data/movies'
import { fetchContentById } from '@/app/lib/contentService'
import SeasonEpisodes from '@/app/components/SeasonEpisodes'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ShareButton from '@/app/components/ShareButton'

export async function generateMetadata({ params }){
  const { type, id, season, episode } = params
  const item = (await fetchContentById(id)) || library.find(l => l.id === id || l.slug === id)
  
  if (!item) {
    return {
      title: 'Movie Not Found — DramaDrift',
      description: 'The requested movie or series could not be found on DramaDrift.'
    }
  }

  const isEpisodic = Array.isArray(item.seasons) && item.seasons.length > 0 && !(item.type === 'anime' && item.format === 'movie')
  const seasonObj = isEpisodic ? item.seasons?.find(se => String(se.season) === String(season)) : null
  const episodeObj = isEpisodic ? seasonObj?.episodes?.find(e => e.id === episode) : null

  // Episode-aware SEO metadata
  const baseTitle = item.title
  const yearPart = item.year || new Date().getFullYear()
  const episodePart = (isEpisodic && seasonObj && episodeObj) ? ` — Season ${seasonObj.season} Episode ${episodeObj.title ? '' : episode} ${episodeObj.title ? `“${episodeObj.title}”` : ''}`.trim() : ''
  const title = `${baseTitle}${episodePart ? episodePart : ` (${yearPart})`} - Watch Online Free | DramaDrift`
  const description = `${(episodeObj?.description || item.description) || ''} Watch ${baseTitle}${episodePart ? episodePart.replace(' — ', ' ') : ''} online free in HD on DramaDrift.`.trim()
  
  return {
    title,
    description,
    keywords: `${item.title}, watch online, free streaming, ${item.type}, DramaDrift, HD quality`,
    openGraph: {
      title,
      description,
      type: 'video.movie',
      url: isEpisodic && season && episode
        ? `https://dramadrift.vercel.app/watch/${type}/${item.slug || id}/${season}/${episode}`
        : `https://dramadrift.vercel.app/watch/${type}/${item.slug || id}`,
      images: [
        {
          url: item.poster,
          width: 1200,
          height: 630,
          alt: `${item.title} poster`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [item.poster]
    },
    alternates: {
      canonical: isEpisodic && season && episode
        ? `https://dramadrift.vercel.app/watch/${type}/${item.slug || id}/${season}/${episode}`
        : `https://dramadrift.vercel.app/watch/${type}/${item.slug || id}`
    }
  }
}

export default async function WatchPage({ params }){
  const { type, id, season, episode } = params

  let item = await fetchContentById(id)
  if(!item) item = library.find(l => l.id === id || l.slug === id)
  if(!item) return <div>Not found</div>

  const isEpisodic = Array.isArray(item.seasons) && item.seasons.length > 0 && !(item.type === 'anime' && item.format === 'movie')
  let src, subtitles, episodeIndex = 0, seriesInfo = null, embedUrl = null
  let seasonObj = null, episodeObj = null
  if(!isEpisodic){
    const s = item.sources?.[0]
    src = s?.src || null
    subtitles = s?.subtitles || []
    embedUrl = item.embedUrl || null
  } else {
    const s = item.seasons?.find(se => String(se.season) === String(season))
    const ep = s?.episodes?.find(e => e.id === episode) || s?.episodes?.[0]
    seasonObj = s || null
    episodeObj = ep || null
    src = ep?.src
    subtitles = ep?.subtitles || []
    embedUrl = item.embedUrl || null
    seriesInfo = { item, season: s, episodes: s?.episodes }
    episodeIndex = s && ep ? s.episodes.findIndex(e => e.id === ep.id) : 0
  }

  const jsonLd = item ? (
    isEpisodic && seasonObj && episodeObj ? {
      '@context': 'https://schema.org',
      '@type': 'TVEpisode',
      name: episodeObj.title || `${item.title} S${seasonObj.season}E${episode}`,
      description: episodeObj.description || item.description,
      thumbnailUrl: item.poster,
      partOfSeason: {
        '@type': 'TVSeason',
        seasonNumber: seasonObj.season,
        partOfSeries: { '@type': 'TVSeries', name: item.title }
      },
      episodeNumber: episode,
      url: `https://dramadrift.vercel.app/watch/${type}/${item.slug || id}/${season}/${episode}`,
      potentialAction: { '@type': 'WatchAction', target: `https://dramadrift.vercel.app/watch/${type}/${item.slug || id}/${season}/${episode}` },
      genre: item.genre || ['Entertainment']
    } : {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: item.title,
      description: item.description,
      image: item.poster,
      url: `https://dramadrift.vercel.app/watch/${type}/${item.slug || id}`,
      genre: item.genre || ['Entertainment']
    }
  ) : null

  // Helper: convert YouTube watch/short links to embeddable iframe URL
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
    return null
  }

  // If src points to YouTube, prefer embedUrl and disable HLS
  const youtubeEmbedFromSrc = src ? toYouTubeEmbed(src) : null
  if(youtubeEmbedFromSrc && !embedUrl){
    embedUrl = youtubeEmbedFromSrc
    src = null
  }

  return (
    <div className="p-0 md:p-6">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* Breadcrumbs */}
      <div className="container-xl page-px mt-4">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: type.charAt(0).toUpperCase() + type.slice(1), href: `/category/${type}` }
        ]} />
      </div>

      {/* Video at top */}
      <div className="w-full">
        <EnhancedPlayer 
          src={src} 
          subtitles={subtitles} 
          seriesInfo={seriesInfo} 
          initialEpisodeIndex={episodeIndex}
          contentId={id}
          type={type}
          season={season}
          episode={episode}
          title={item.title}
          poster={item.poster}
          embedUrl={embedUrl}
        />
      </div>

      {/* Below video: title, meta, actions */}
      <div className="container-xl page-px mt-4 section-gap">
        <h1 className="text-xl md:text-2xl font-bold">{item.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span>{item.year || new Date().getFullYear()}</span>
            <span>•</span>
            <span>{item.duration ? `${Math.floor(item.duration/60)}m ${item.duration%60}s` : 'N/A'}</span>
            <span>•</span>
            <span className="capitalize">{item.type}</span>
            {item.genre && item.genre.length > 0 && (
              <span>• {item.genre.join(', ')}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ShareButton title={item.title} />
          </div>
        </div>

        {/* Description & Cast like YouTube collapsible summary */}
        <div className="glass-panel rounded-2xl card-pad space-y-3">
          <div className="text-sm text-white/90 leading-6">{item.description}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {item.director && (
              <span className="pill bg-white/5">Director: <span className="text-white/90 ml-1">{item.director}</span></span>
            )}
            {Array.isArray(item.cast) && item.cast.slice(0,6).map(c => (
              <span key={c} className="pill bg-white/5">{c}</span>
            ))}
          </div>
        </div>

        {/* Episodes and transcript */}
        <div className="section-gap">
          {item.type !== 'movie' && (
            <SeasonEpisodes item={item} activeSeasonNumber={season} activeEpisodeId={episode} />
          )}
          {/* <TranscriptSection subtitles={subtitles} /> */}
        </div>

        {/* Attention-grabbing rail underneath content like Netflix rows */}
        <div className="mt-6">
          <RelatedContent currentItem={item} library={library} variant="rail" />
        </div>
      </div>
    </div>
  )
}