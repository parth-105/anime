import jwt from 'jsonwebtoken'

export async function POST(req){
  const { username, password } = await req.json()
  const ADMIN_USER = process.env.ADMIN_USER || 'admin@admin.com'
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin@admin.com'
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

  if(username !== ADMIN_USER || password !== ADMIN_PASS){
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const token = jwt.sign({ role: 'admin', sub: ADMIN_USER }, JWT_SECRET, { expiresIn: '8h' })
  return Response.json({ token })
}


