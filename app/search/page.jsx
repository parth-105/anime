import Link from 'next/link'
import Image from 'next/image'
import { searchContent } from '@/app/lib/contentService'
import SearchClient from './SearchClient'
import InfiniteResults from './InfiniteResults'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  // Always load only the first page initially for proper infinite scroll
  let data
  try {
    data = await searchContent({ q, type, genre, sort, page: 1, limit: 24 })
  } catch (error) {
  //  console.error('[SEARCH-PAGE] Error fetching search results:', error)
    // Try a fallback search with simpler parameters
    try {
      data = await searchContent({ q, page: 1, limit: 24 })
    } catch (fallbackError) {
   //   console.error('[SEARCH-PAGE] Fallback search also failed:', fallbackError)
      data = { results: [], total: 0, totalPages: 0, page: 1, pageSize: 24 }
    }
  }
  
  const { results = [], total = 0, totalPages = 0, page: serverPage = pageNum, pageSize = 24, timestamp } = data || {}

  // Debug logging in development
  if(process.env.NODE_ENV !== 'production'){
    // console.log('[SEARCH-PAGE] received data:', { 
    //   query: q, 
    //   total, 
    //   resultsCount: results?.length, 
    //   timestamp: timestamp ? new Date(timestamp).toISOString() : 'no timestamp'
    // })
  }

  return (
    <div className="min-h-screen bg-cinemalux">
      <div className="container-xl page-px page-py section-gap">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          {q ? `Search Results for "${q}"` : 'Search Movies & Series'}
        </h1>
        
        <SearchClient />

        <div className="mt-6 text-white/70">{total} results</div>

        <div className="mt-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <InfiniteResults 
            key={`${q}-${type}-${genre}-${sort}`} 
            initial={{ results, total, totalPages, page: serverPage || pageNum, pageSize }} 
            query={{ q, type, genre, sort }} 
          />
        </div>
      </div>
    </div>
  )
}


