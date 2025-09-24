'use client'

import { useRouter } from 'next/navigation'

export default function Modal({ children }){
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60" onClick={() => router.back()} />
      <div className="absolute inset-x-0 top-16 mx-auto max-w-3xl w-[92%]">
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}


