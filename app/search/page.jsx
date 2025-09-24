import Link from 'next/link'
import Image from 'next/image'
import { searchContent } from '@/app/lib/contentService'
import SearchClient from './SearchClient'
import InfiniteResults from './InfiniteResults'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }){
  const q = searchParams?.q || ''
  const title = q ? `Search “${q}” — DramaDrift` : 'Search — DramaDrift'
  const canonical = q ? `https://dramadrift.vercel.app/search?q=${encodeURIComponent(q)}` : 'https://dramadrift.vercel.app/search'
  return { 
    title, 
    description: 'Search movies and series on DramaDrift',
    robots: { index: false },
    alternates: { canonical }
  }
}

export default async function SearchPage({ searchParams }){
  const { q = '', type, genre, sort, page = '1' } = searchParams || {}
  const pageNum = Number(page) || 1

  const data = await searchContent({ q, type, genre, sort, page: pageNum, limit: 24 })
  const { results, total, totalPages, page: serverPage, pageSize } = data

  return (
    <div className="min-h-screen bg-cinemalux">
      <div className="container-xl page-px page-py section-gap">
        <SearchClient />

        <div className="mt-6 text-white/70">{total} results</div>

        <InfiniteResults initial={{ results, total, totalPages, page: serverPage || pageNum, pageSize }} query={{ q, type, genre, sort }} />
      </div>
    </div>
  )
}


