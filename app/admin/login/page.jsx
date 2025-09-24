'use client'
import { useState } from 'react'
import { adminLogin } from '@/app/lib/adminClient'
import { useRouter } from 'next/navigation'

export default function AdminLogin(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) =>{
    e.preventDefault()
    setLoading(true)
    setErr('')
    try{
      await adminLogin(email, password)
      router.push('/admin/upload')
    }catch(ex){ setErr(ex.message) } finally{ setLoading(false) }
  }

  return (
    <div className="container-xl page-px page-py">
      <div className="max-w-md mx-auto glass-panel rounded-2xl card-pad space-y-4">
        <h1 className="text-xl font-bold">Admin Login</h1>
        {err && <div className="bg-red-500/20 border border-red-500/40 p-2 rounded text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input className="w-full h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" className="w-full h-11 rounded-lg bg-white/10 border border-white/15 px-3" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="text-xs text-white/60">Default dev creds are prefilled. Configure real admin in server env.</p>
      </div>
    </div>
  )
}

// metadata moved to parent layout to avoid exporting from client component

