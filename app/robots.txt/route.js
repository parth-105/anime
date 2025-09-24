export function GET(){
  const body = `User-agent: *
Allow: /
Sitemap: https://dramadrift.vercel.app/sitemap.xml`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } })
}


