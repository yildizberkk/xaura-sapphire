import { NextResponse } from 'next/server'
import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto'

/**
 * Returns null when authorized, or a NextResponse 401/403 when not.
 * Routes call this first and short-circuit on the returned response.
 */
export function requireAdminAuth(request: Request): NextResponse | null {
  const expected = process.env.ADMIN_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET not configured on server' },
      { status: 500 },
    )
  }
  const header = request.headers.get('authorization') ?? ''
  const url = new URL(request.url)
  const queryToken = url.searchParams.get('token')

  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  const token = bearer || queryToken

  if (!token) {
    return NextResponse.json({ error: 'missing token' }, { status: 401 })
  }
  if (!timingSafeEqual(token, expected)) {
    return NextResponse.json({ error: 'invalid token' }, { status: 403 })
  }
  return null
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  const maxLen = Math.max(aBuf.length, bBuf.length)
  const aPadded = Buffer.alloc(maxLen)
  const bPadded = Buffer.alloc(maxLen)
  aBuf.copy(aPadded)
  bBuf.copy(bPadded)
  return nodeTimingSafeEqual(aPadded, bPadded) && aBuf.length === bBuf.length
}
