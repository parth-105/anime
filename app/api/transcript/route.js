// Fetch and merge WebVTT subtitle files into a simple transcript
async function fetchText(url){
  const res = await fetch(url)
  if(!res.ok) throw new Error('Failed to fetch VTT')
  return await res.text()
}

function vttToText(vtt){
  const lines = vtt.split(/\r?\n/)
  const text = []
  for(const line of lines){
    if(!line) continue
    if(/-->/.test(line)) continue
    if(/^WEBVTT/i.test(line)) continue
    if(/^\d+$/.test(line)) continue
    text.push(line)
  }
  return text.join(' ').replace(/\s+/g,' ').trim()
}

export async function POST(request){
  try{
    const body = await request.json()
    const files = body?.subtitleFiles || []
    if(!Array.isArray(files) || files.length === 0){
      return Response.json({ transcript: null }, { status: 200 })
    }
    const texts = []
    for(const f of files){
      const vtt = await fetchText(f.url)
      texts.push(vttToText(vtt))
    }
    const transcript = texts.join('\n')
    return Response.json({ transcript })
  }catch(e){
    return Response.json({ error: 'Failed to build transcript' }, { status: 500 })
  }
}


