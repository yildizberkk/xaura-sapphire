import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { publishPendingReminders } from '@/lib/sms-reminders-publish'
import { reconcileDeliveryReports } from '@/lib/sms-reminders-reconcile'
import { alertOps } from '@/lib/telegram'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'test') {
    const authHeader = request.headers.get('authorization') ?? ''
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const started = Date.now()
  const result: Record<string, unknown> = {}

  try {
    result.publish = await publishPendingReminders({ kind: 'all' })
  } catch (err) {
    result.publishError = err instanceof Error ? err.message : String(err)
    await alertOps('error', 'watchdog: publishPendingReminders threw', { error: String(err) })
  }

  try {
    result.reconcile = await reconcileDeliveryReports()
  } catch (err) {
    result.reconcileError = err instanceof Error ? err.message : String(err)
    await alertOps('error', 'watchdog: reconcileDeliveryReports threw', { error: String(err) })
  }

  const { data: needsAlert } = await supabaseAdmin
    .from('message_sends')
    .select('id, scheduled_message_id, status, netgsm_return_code, last_error, phone_snapshot, retry_count')
    .is('alerted_at', null)
    .or('status.eq.publish_rejected,and(status.eq.failed,retry_count.gte.1)')
    .limit(25)

  let alertsFired = 0
  for (const row of needsAlert ?? []) {
    await alertOps('error', `message_send terminal: ${row.status}`, {
      id: row.id,
      status: row.status,
      code: row.netgsm_return_code ?? '(none)',
      error: row.last_error ?? '(none)',
      phone: row.phone_snapshot,
    })
    await supabaseAdmin
      .from('message_sends')
      .update({ alerted_at: new Date().toISOString() })
      .eq('id', row.id)
    alertsFired++
  }

  const missedWindowCutoff = new Date(Date.now() - 5 * 60_000).toISOString()
  const { data: staleSmIds } = await supabaseAdmin
    .from('scheduled_messages')
    .select('id')
    .lt('reminder_at', missedWindowCutoff)
  const staleIds = (staleSmIds ?? []).map(r => r.id)
  if (staleIds.length > 0) {
    const { data: missedWindow } = await supabaseAdmin
      .from('message_sends')
      .select('id, scheduled_message_id, phone_snapshot')
      .eq('status', 'pending')
      .in('scheduled_message_id', staleIds)
      .is('alerted_at', null)
      .limit(25)
    for (const row of missedWindow ?? []) {
      await alertOps('error', 'message_send missed publish window', {
        id: row.id,
        scheduled_message_id: row.scheduled_message_id,
        phone: row.phone_snapshot,
      })
      await supabaseAdmin
        .from('message_sends')
        .update({ alerted_at: new Date().toISOString() })
        .eq('id', row.id)
      alertsFired++
    }
  }
  result.alertsFired = alertsFired
  result.elapsedMs = Date.now() - started

  return NextResponse.json(result)
}
