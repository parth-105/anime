export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    if(!url || !/^https?:\/\/.+youtube\.com|youtu\.be/.test(url)){
      return Response.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } })
    if(!res.ok) return Response.json({ error: 'Failed to fetch oEmbed' }, { status: 400 })
    const data = await res.json()
    return Response.json({
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
      provider: data.provider_name,
      url
    })
  }catch(e){
    return Response.json({ error: 'Import error' }, { status: 500 })
  }
}


