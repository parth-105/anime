import { fetchContentById } from '@/app/lib/contentService'
import { library } from '@/app/data/movies'

export async function generateMetadata({ params }){
  const { type, id } = params
  let item = await fetchContentById(id)
  if(!item) item = library.find(l => l.id === id || l.slug === id)
  
  if (!item) {
    return {
      title: 'Content Not Found — DramaDrift',
      description: 'The requested content could not be found on DramaDrift.'
    }
  }

  const title = `${item.title} (${item.year || new Date().getFullYear()}) - Watch Online Free | DramaDrift`
  const description = `${item.description} Watch ${item.title} online free in HD quality. Stream now on DramaDrift.`
  
  return {
    title,
    description,
    keywords: `${item.title}, watch online, free streaming, ${item.type}, DramaDrift`,
    openGraph: {
      title,
      description,
      type: 'video.movie',
      url: `https://dramadrift.vercel.app/watch/${type}/${id}`,
      images: [{ url: item.poster, width: 1200, height: 630, alt: `${item.title} poster` }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [item.poster]
    }
  }
}

export default async function WatchRoot({ params }){
  const { type, id } = params
  
  // Fetch the actual content data
  let item = await fetchContentById(id)
  if(!item) item = library.find(l => l.id === id || l.slug === id)
  if(!item) return <div>Not found</div>

  // Production-level redirect logic
  let href
  
  if(type === 'movie'){
    href = `/watch/movie/${id}/0/0`
  } else {
    // For series/anime/kdrama, determine the proper route
    const hasSeasons = item.seasons && Array.isArray(item.seasons) && item.seasons.length > 0
    const isAnimeMovie = item.type === 'anime' && item.format === 'movie'
    
    if (isAnimeMovie) {
      // Anime movies should use movie format
      href = `/watch/movie/${id}/0/0`
    } else if (hasSeasons) {
      // Find the first valid season/episode
      let foundValidRoute = false
      for (const season of item.seasons) {
        if (season.episodes && season.episodes.length > 0) {
          const episode = season.episodes[0]
          if (episode.id && episode.id !== 'undefined') {
            href = `/watch/${type}/${id}/${season.season}/${episode.id}`
            foundValidRoute = true
            break
          }
        }
      }
      
      if (!foundValidRoute) {
        // No valid season/episode found, use default structure
        href = `/watch/${type}/${id}/1/1`
      }
    } else {
      // No seasons data, use default structure for episodic content
      if (type === 'kdrama' || type === 'series' || type === 'anime') {
        href = `/watch/${type}/${id}/1/1`
      } else {
        href = `/watch/${type}/${id}`
      }
    }
  }
  
  // Redirect to the proper route
  return (
    <div className="min-h-screen bg-cinemalux flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Redirecting...</h1>
        <a className="underline text-blue-400 hover:text-blue-300" href={href}>
          Continue to player →
        </a>
        <script dangerouslySetInnerHTML={{
          __html: `window.location.href = '${href}';`
        }} />
      </div>
    </div>
  )
}


