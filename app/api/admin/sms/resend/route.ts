import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { normalizePhone } from '@/lib/phone'
import { sendImmediateSms } from '@/lib/netgsm'
import { resolveMessage } from '@/lib/sms-reminders-template'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const url = new URL(request.url)
  const messageSendId = url.searchParams.get('message_send_id')
  if (!messageSendId) {
    return NextResponse.json({ error: 'message_send_id required' }, { status: 400 })
  }

  const { data: row, error } = await supabaseAdmin
    .from('message_sends')
    .select(`
      id, status, phone_snapshot, registration_id,
      scheduled_messages ( session_title, message_body ),
      registrations ( first_name )
    `)
    .eq('id', messageSendId)
    .single()
  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'not found' }, { status: 404 })
  }

  const terminalStates = ['delivered', 'retry_published', 'canceled']
  if (terminalStates.includes(row.status)) {
    return NextResponse.json(
      { error: `cannot resend: already in terminal state '${row.status}'` },
      { status: 409 },
    )
  }

  const sm = (row as unknown as { scheduled_messages: { session_title: string; message_body: string } }).scheduled_messages
  const reg = (row as unknown as { registrations: { first_name: string } | null }).registrations
  if (!sm || !reg) {
    return NextResponse.json({ error: 'scheduled_message or registration missing' }, { status: 400 })
  }

  const normalized = normalizePhone(row.phone_snapshot)
  if (!normalized) {
    return NextResponse.json({ error: 'phone did not parse' }, { status: 400 })
  }

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
        netgsm_jobid: result.jobid,
        netgsm_return_code: result.code,
        retry_count: 1,
        published_at: new Date().toISOString(),
        last_error: 'manual resend via admin',
      })
      .eq('id', row.id)
    return NextResponse.json({ ok: true, jobid: result.jobid, code: result.code })
  }

  return NextResponse.json(
    { ok: false, code: result.code, message: 'Netgsm rejected immediate send' },
    { status: 502 },
  )
}
