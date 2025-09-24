import Link from 'next/link'
import Image from 'next/image'
import { contentTypes, genres } from '@/app/data/movies'
import { fetchContent } from '@/app/lib/contentService'
import CategoryContent from './CategoryContent'
import Breadcrumbs from '@/app/components/Breadcrumbs'

export async function generateMetadata({ params }) {
  const { type } = params
  const typeInfo = contentTypes[type]
  
  if (!typeInfo) {
    return {
      title: 'Category Not Found — DramaDrift',
      description: 'The requested category could not be found.'
    }
  }

  const content = await fetchContent({ type, limit: 1 })
  
  return {
    title: `${typeInfo.name} - Watch Online Free | DramaDrift`,
    description: `Watch the best ${typeInfo.name.toLowerCase()} online free in HD quality. Stream ${content.length}+ ${typeInfo.name.toLowerCase()} with subtitles and multiple audio tracks on DramaDrift.`,
    keywords: `${typeInfo.name}, watch online, free streaming, HD quality, ${typeInfo.name.toLowerCase()}, DramaDrift`,
    openGraph: {
      title: `${typeInfo.name} - Watch Online Free | DramaDrift`,
      description: `Watch the best ${typeInfo.name.toLowerCase()} online free in HD quality.`,
      type: 'website',
      images: [{
        url: `https://dramadrift.vercel.app/category-${type}.jpg`,
        width: 1200,
        height: 630,
        alt: `${typeInfo.name} on DramaDrift`
      }]
    }
  }
}

export default async function CategoryPage({ params }) {
  const { type } = params
  const typeInfo = contentTypes[type]
  
  if (!typeInfo) {
    return <div className="text-center py-12">Category not found</div>
  }

  const content = await fetchContent({ type, limit: 24, page: 1 })
  return (
    <div className="space-y-4 bg-cinemalux">
      <div className="container-xl page-px pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: typeInfo.name }]} />
      </div>
      <CategoryContent type={type} typeInfo={typeInfo} initial={content} />
    </div>
  )
}