'use client'

import Link from 'next/link'

export default function Breadcrumbs({ items = [] }){
  if(!items || items.length === 0) return null
  return (
    <nav className="text-sm text-white/70" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-1">
            {idx > 0 && <span className="opacity-60">/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:underline hover:text-white/90">{it.label}</Link>
            ) : (
              <span className="text-white/90">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}


