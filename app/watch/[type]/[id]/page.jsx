import Player from '@/app/components/Player'
import { library } from '@/app/data/movies'

export async function generateMetadata({ params }){
  const { type, id } = params
  const item = library.find(l => l.id === id)
  
  if (!item) {
    return {
      title: 'Movie Not Found — NeonFlix',
      description: 'The requested movie or series could not be found on NeonFlix.'
    }
  }

  const title = `${item.title} (${item.year || new Date().getFullYear()}) - Watch Online Free | NeonFlix`
  const description = `${item.description} Watch ${item.title} online free in HD quality. Stream now on NeonFlix.`
  
  return {
    title,
    description,
    keywords: `${item.title}, watch online, free streaming, ${item.type}, NeonFlix`,
    openGraph: {
      title,
      description,
      type: 'video.movie',
      url: `https://neonflix.com/watch/${type}/${id}`,
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

export default function WatchRoot({ params }){
  const { type, id } = params
  let item
  if(type === 'movie') item = library.find(l => l.id === id)
  else item = library.find(l => l.id === id)
  if(!item) return <div>Not found</div>

  let href = `/watch/${type}/${id}`
  if(type === 'movie'){
    href = `/watch/movie/${id}/0/0`
  } else {
    const firstSeason = item.seasons?.[0]
    const firstEp = firstSeason?.episodes?.[0]
    href = `/watch/series/${id}/${firstSeason?.season}/${firstEp?.id}`
  }
  return <a className="underline" href={href}>Continue to player →</a>
}


