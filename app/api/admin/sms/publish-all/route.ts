import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { publishPendingReminders } from '@/lib/sms-reminders-publish'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  try {
    const summary = await publishPendingReminders({ kind: 'all' })
    return NextResponse.json({ ok: true, summary })
  } catch (err) {
    console.error('[publish-all] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
