const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

let memoryToken = null

export function getToken(){
  if(memoryToken) return memoryToken
  if(typeof window !== 'undefined'){
    memoryToken = localStorage.getItem('neonflix_admin_token')
  }
  return memoryToken
}

export function setToken(token){
  memoryToken = token
  if(typeof window !== 'undefined'){
    if(token) localStorage.setItem('neonflix_admin_token', token)
    else localStorage.removeItem('neonflix_admin_token')
  }
}

export async function adminLogin(username, password){
  const res = await fetch(`${API_BASE}/auth/login`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ username, password })
  })
  if(!res.ok) throw new Error('Invalid credentials')
  const data = await res.json()
  setToken(data.token)
  return data
}

export async function createContent(content){
  const token = getToken()
  if(!token) throw new Error('Not authenticated')
  const res = await fetch(`${API_BASE}/content`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(content)
  })
  if(!res.ok){
    const err = await res.json().catch(()=>({}))
    throw new Error(err.error || 'Failed to create content')
  }
  return res.json()
}


