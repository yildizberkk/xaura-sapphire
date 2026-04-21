import { NextResponse } from 'next/server'
import { normalizePhone } from '@/lib/phone'
import { sendScheduledSms } from '@/lib/netgsm'
import { formatNetgsmStartdate } from '@/lib/schedule-time'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const body = await request.json().catch(() => null) as { phone?: string } | null
  if (!body?.phone) {
    return NextResponse.json({ error: 'body must be {"phone": "+90..."}' }, { status: 400 })
  }
  const normalized = normalizePhone(body.phone)
  if (!normalized) {
    return NextResponse.json({ error: 'phone did not parse' }, { status: 400 })
  }

  const expectedArrival = new Date(Date.now() + 15 * 60_000)
  const startdate = formatNetgsmStartdate(expectedArrival, 'Europe/Istanbul')

  const result = await sendScheduledSms({
    phoneNational: normalized.national,
    message: `Preflight TZ check. Gönderim beklenen: ${expectedArrival.toISOString()} UTC.`,
    startdate,
  })

  return NextResponse.json({
    ok: result.success,
    jobid: result.jobid,
    code: result.code,
    startdate,
    expectedArrivalUtc: expectedArrival.toISOString(),
  })
}
