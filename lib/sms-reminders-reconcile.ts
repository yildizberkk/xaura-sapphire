import { supabaseAdmin } from './supabase-server'
import { normalizePhone } from './phone'
import { sendImmediateSms, getDeliveryReport } from './netgsm'
import { resolveMessage } from './sms-reminders-template'

export interface ReconcileSummary {
  checked: number
  delivered: number
  failed: number
  retried: number
}

/**
 * For every published row whose reminder_at is at least 3 minutes in the past
 * and hasn't been recently polled, query Netgsm for its delivery status and
 * update the row. Batched by jobid.
 */
export async function reconcileDeliveryReports(): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = { checked: 0, delivered: 0, failed: 0, retried: 0 }

  const now = Date.now()
  const threeMinAgo = new Date(now - 3 * 60_000).toISOString()
  const fiveMinAgo  = new Date(now - 5 * 60_000).toISOString()

  const { data: eligibleSm, error: smErr } = await supabaseAdmin
    .from('scheduled_messages')
    .select('id')
    .lt('reminder_at', threeMinAgo)
  if (smErr) throw new Error(`reconcile: load eligible scheduled_messages failed: ${smErr.message}`)
  const eligibleSmIds = (eligibleSm ?? []).map(r => r.id)
  if (eligibleSmIds.length === 0) return summary

  const { data: rows, error } = await supabaseAdmin
    .from('message_sends')
    .select(`
      id, netgsm_jobid, status, scheduled_message_id,
      scheduled_messages ( id, session_start_at, reminder_at, message_body, session_title ),
      registration_id, phone_snapshot,
      registrations ( first_name )
    `)
    .in('status', ['published', 'retry_published'])
    .not('netgsm_jobid', 'is', null)
    .in('scheduled_message_id', eligibleSmIds)
    .or(`last_checked_at.is.null,last_checked_at.lt.${fiveMinAgo}`)
    .limit(200)
  if (error) throw new Error(`reconcile: load published failed: ${error.message}`)
  if (!rows || rows.length === 0) return summary

  const jobids = rows.map(r => r.netgsm_jobid!).filter(Boolean)
  const reports = await getDeliveryReport(jobids)
  const reportByJobId = new Map(reports.map(r => [r.jobid, r]))

  for (const row of rows) {
    const report = row.netgsm_jobid ? reportByJobId.get(row.netgsm_jobid) : undefined
    const nowIso = new Date().toISOString()
    summary.checked++

    if (!report || report.status === 'unknown' || report.status === 'pending') {
      await supabaseAdmin
        .from('message_sends')
        .update({ last_checked_at: nowIso, last_error: report?.raw ?? null })
        .eq('id', row.id)
      continue
    }
    if (report.status === 'delivered') {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'delivered', delivered_at: nowIso, last_checked_at: nowIso })
        .eq('id', row.id)
      summary.delivered++
      continue
    }
    if (report.status === 'failed') {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'failed', last_checked_at: nowIso, last_error: report.raw ?? 'delivery failed' })
        .eq('id', row.id)
      summary.failed++
    }
  }

  const { data: retryRows, error: retryErr } = await supabaseAdmin
    .from('message_sends')
    .select(`
      id, phone_snapshot,
      scheduled_messages ( session_start_at, message_body, session_title ),
      registrations ( first_name )
    `)
    .eq('status', 'failed')
    .eq('retry_count', 0)
    .limit(50)
  if (retryErr) throw new Error(`reconcile: load retry candidates failed: ${retryErr.message}`)
  if (!retryRows) return summary

  const retryCutoff = new Date(now - 5 * 60_000)

  for (const row of retryRows) {
    const sm = (row as unknown as { scheduled_messages: { session_start_at: string; message_body: string; session_title: string } }).scheduled_messages
    const reg = (row as unknown as { registrations: { first_name: string } | null }).registrations
    if (!sm || !reg) continue

    if (new Date(sm.session_start_at) < retryCutoff) continue

    const normalized = normalizePhone(row.phone_snapshot)
    if (!normalized) continue

    const message = resolveMessage({
      template: sm.message_body,
      firstName: reg.first_name,
      sessionTitle: sm.session_title,
    })

    const result = await sendImmediateSms({
      phoneNational: normalized.national,
      message,
    })

    if (result.success && result.jobid) {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'retry_published',
          retry_count: 1,
          netgsm_jobid: result.jobid,
          netgsm_return_code: result.code,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', row.id)
      summary.retried++
    } else {
      await supabaseAdmin
        .from('message_sends')
        .update({
          retry_count: 1,
          last_error: `retry rejected: ${result.code}`,
        })
        .eq('id', row.id)
    }
  }

  return summary
}
