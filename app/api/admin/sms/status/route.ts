import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const { data: scheduled, error: smErr } = await supabaseAdmin
    .from('scheduled_messages')
    .select('id, day_idx, session_idx, session_title, session_start_at, reminder_at')
    .order('session_start_at', { ascending: true })
  if (smErr) return NextResponse.json({ error: smErr.message }, { status: 500 })

  const { data: sends, error: sendsErr } = await supabaseAdmin
    .from('message_sends')
    .select('scheduled_message_id, status')
  if (sendsErr) return NextResponse.json({ error: sendsErr.message }, { status: 500 })

  const counts = new Map<string, Record<string, number>>()
  for (const s of sends ?? []) {
    const key = s.scheduled_message_id
    const bucket = counts.get(key) ?? {}
    bucket[s.status] = (bucket[s.status] ?? 0) + 1
    counts.set(key, bucket)
  }

  const sessions = (scheduled ?? []).map(sm => ({
    id: sm.id,
    dayIdx: sm.day_idx,
    sessionIdx: sm.session_idx,
    title: sm.session_title,
    sessionStartAt: sm.session_start_at,
    reminderAt: sm.reminder_at,
    counts: counts.get(sm.id) ?? {},
  }))

  const totals: Record<string, number> = {}
  for (const s of sends ?? []) totals[s.status] = (totals[s.status] ?? 0) + 1

  const { data: cfg } = await supabaseAdmin
    .from('sms_config')
    .select('killswitch')
    .eq('id', 1)
    .single()

  return NextResponse.json({
    killswitch: cfg?.killswitch ?? false,
    totals,
    sessions,
  })
}
