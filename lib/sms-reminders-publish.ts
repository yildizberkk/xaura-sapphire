import { supabaseAdmin } from './supabase-server'
import { normalizePhone } from './phone'
import { sendScheduledSms } from './netgsm'
import { loadSchedule } from './schedule-loader'
import { sessionStartUtc, reminderAtUtc, formatNetgsmStartdate } from './schedule-time'
import {
  DEFAULT_TEMPLATE,
  resolveMessage,
  validateTemplateLength,
} from './sms-reminders-template'
import {
  type PublishScope,
  type PublishSummary,
  type MessageSendStatus,
  PUBLISH_CUTOFF_MS,
} from './sms-reminders-types'

/**
 * Idempotent: safe to call from the inline registration hook, the watchdog
 * cron, and the admin endpoint concurrently — the DB unique constraints
 * (day_idx,session_idx) and (scheduled_message_id,registration_id) prevent
 * duplicate publishes.
 */
export async function publishPendingReminders(scope: PublishScope): Promise<PublishSummary> {
  const summary: PublishSummary = {
    scheduledMessagesInserted: 0,
    messageSendsInserted: 0,
    published: 0,
    publishRejected: 0,
    skippedTooLate: 0,
  }

  const { data: config } = await supabaseAdmin
    .from('sms_config')
    .select('killswitch')
    .eq('id', 1)
    .single()
  if (config?.killswitch) {
    console.log('[publish] killswitch on — no-op')
    return summary
  }

  const schedule = await loadSchedule()
  const tz = schedule.event.timezone ?? 'Europe/Istanbul'

  for (let dayIdx = 0; dayIdx < schedule.days.length; dayIdx++) {
    const day = schedule.days[dayIdx]
    for (let sessionIdx = 0; sessionIdx < day.sessions.length; sessionIdx++) {
      const s = day.sessions[sessionIdx]
      if (s.smsReminder === false) continue
      if (s.type === 'meal' || s.type === 'break') continue
      if (!s.start) continue

      const startAt = sessionStartUtc(day.date, s.start, tz)
      const remindAt = reminderAtUtc(day.date, s.start, tz)

      const template = s.smsMessage ?? DEFAULT_TEMPLATE

      const probe = resolveMessage({
        template,
        firstName: 'Aleksandra-Emmanuelle',
        sessionTitle: s.title,
      })
      const check = validateTemplateLength(probe)
      if (!check.ok) {
        throw new Error(
          `Template for session "${s.title}" (day ${dayIdx}, idx ${sessionIdx}) too long: ${check.reason}`,
        )
      }

      const { error, data } = await supabaseAdmin
        .from('scheduled_messages')
        .upsert(
          {
            day_idx: dayIdx,
            session_idx: sessionIdx,
            session_title: s.title,
            session_start_at: startAt.toISOString(),
            reminder_at: remindAt.toISOString(),
            message_body: template,
          },
          { onConflict: 'day_idx,session_idx', ignoreDuplicates: false },
        )
        .select('id')
      if (error) throw new Error(`upsert scheduled_messages failed: ${error.message}`)
      if (data && data.length > 0) summary.scheduledMessagesInserted += data.length
    }
  }

  const regQuery = supabaseAdmin
    .from('registrations')
    .select('id, first_name, phone')
    .eq('consent', true)

  if (scope.kind === 'registration') regQuery.eq('id', scope.registrationId)
  const { data: regs, error: regErr } = await regQuery
  if (regErr) throw new Error(`load registrations failed: ${regErr.message}`)
  if (!regs || regs.length === 0) return summary

  const smQuery = supabaseAdmin
    .from('scheduled_messages')
    .select('id, day_idx, session_idx, session_title, reminder_at, session_start_at, message_body')
  if (scope.kind === 'session') {
    smQuery.eq('day_idx', scope.dayIdx).eq('session_idx', scope.sessionIdx)
  }
  const { data: scheduled, error: smErr } = await smQuery
  if (smErr) throw new Error(`load scheduled_messages failed: ${smErr.message}`)
  if (!scheduled || scheduled.length === 0) return summary

  const now = Date.now()

  for (const sm of scheduled) {
    const reminderAt = new Date(sm.reminder_at).getTime()
    if (reminderAt <= now + PUBLISH_CUTOFF_MS) continue

    for (const reg of regs) {
      const normalized = normalizePhone(reg.phone)
      const phoneSnapshot = normalized?.e164 ?? reg.phone

      const { data, error } = await supabaseAdmin
        .from('message_sends')
        .upsert(
          {
            scheduled_message_id: sm.id,
            registration_id: reg.id,
            phone_snapshot: phoneSnapshot,
            status: 'pending' as MessageSendStatus,
          },
          { onConflict: 'scheduled_message_id,registration_id', ignoreDuplicates: true },
        )
        .select('id')
      if (error) throw new Error(`upsert message_sends failed: ${error.message}`)
      if (data && data.length > 0) summary.messageSendsInserted += data.length
    }
  }

  const PAGE_SIZE = 500
  let claimedAll: Array<{ id: string; scheduled_message_id: string; registration_id: string; phone_snapshot: string }> = []

  const scheduledIds = scheduled.map(s => s.id)

  const MAX_ITERATIONS = 100
  // Loop: grab pending rows in pages of PAGE_SIZE, atomically claim by moving to
  // 'sending' status, and accumulate until a page returns fewer than PAGE_SIZE.
  // MAX_ITERATIONS is a safety cap (100 pages × 500 = 50k rows) to guard against
  // pathological loops under concurrent inserts.
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const sendQuery = supabaseAdmin
      .from('message_sends')
      .select('id, scheduled_message_id, registration_id, phone_snapshot')
      .eq('status', 'pending')
      .in('scheduled_message_id', scheduledIds)
      .limit(PAGE_SIZE)

    if (scope.kind === 'registration') {
      sendQuery.eq('registration_id', scope.registrationId)
    }

    const { data: page, error: pendErr } = await sendQuery
    if (pendErr) throw new Error(`load pending sends failed: ${pendErr.message}`)
    if (!page || page.length === 0) break

    const pageIds = page.map(r => r.id)
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from('message_sends')
      .update({ status: 'sending' as MessageSendStatus })
      .in('id', pageIds)
      .eq('status', 'pending')
      .select('id, scheduled_message_id, registration_id, phone_snapshot')
    if (claimErr) throw new Error(`claim pending sends failed: ${claimErr.message}`)

    if (claimed && claimed.length > 0) claimedAll = claimedAll.concat(claimed)

    // If the initial page was smaller than the limit, no more pages exist.
    if (page.length < PAGE_SIZE) break
  }

  const pending = claimedAll
  if (pending.length === 0) return summary

  const smById = new Map(scheduled.map(s => [s.id, s]))
  const regById = new Map(regs.map(r => [r.id, r]))

  const CONCURRENCY = 50
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    await Promise.all(pending.slice(i, i + CONCURRENCY).map(async (send) => {
    const sm = smById.get(send.scheduled_message_id)
    if (!sm) return
    const reg = send.registration_id ? regById.get(send.registration_id) : null
    if (!reg) return

    const reminderMs = new Date(sm.reminder_at).getTime()

    if (reminderMs <= Date.now() + PUBLISH_CUTOFF_MS) {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'skipped_too_late', last_error: 'reminder within 2-min cutoff at publish time' })
        .eq('id', send.id)
      summary.skippedTooLate++
      return
    }

    const normalized = normalizePhone(send.phone_snapshot)
    if (!normalized) {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'publish_rejected',
          netgsm_return_code: 'INVALID_PHONE',
          last_error: 'phone did not parse to valid E.164',
        })
        .eq('id', send.id)
      summary.publishRejected++
      return
    }

    const resolved = resolveMessage({
      template: sm.message_body,
      firstName: reg.first_name,
      sessionTitle: sm.session_title,
    })
    const startdate = formatNetgsmStartdate(new Date(sm.reminder_at), tz)

    const result = await sendScheduledSms({
      phoneNational: normalized.national,
      message: resolved,
      startdate,
    })

    if (result.success && result.jobid) {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'published',
          netgsm_jobid: result.jobid,
          netgsm_return_code: result.code,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', send.id)
      summary.published++
    } else if (result.code === 'TIMEOUT' || result.code === 'NETWORK_ERROR') {
      // Transient — revert to pending so the next watchdog tick retries
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'pending' as MessageSendStatus })
        .eq('id', send.id)
    } else {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'publish_rejected',
          netgsm_return_code: result.code,
          last_error: `Netgsm rejected publish with code ${result.code}`,
        })
        .eq('id', send.id)
      summary.publishRejected++
    }
  }))}

  return summary
}
