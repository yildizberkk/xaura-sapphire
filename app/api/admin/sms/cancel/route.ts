import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { cancelScheduledSms } from '@/lib/netgsm'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const url = new URL(request.url)
  const scheduledMessageId = url.searchParams.get('scheduled_message_id')
  if (!scheduledMessageId) {
    return NextResponse.json({ error: 'scheduled_message_id required' }, { status: 400 })
  }

  const { data: rows, error } = await supabaseAdmin
    .from('message_sends')
    .select('id, netgsm_jobid')
    .eq('scheduled_message_id', scheduledMessageId)
    .in('status', ['published', 'retry_published'])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let canceled = 0
  let failed = 0
  for (const row of rows ?? []) {
    if (!row.netgsm_jobid) continue
    const res = await cancelScheduledSms(row.netgsm_jobid)
    if (res.success) {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'canceled', last_error: `canceled via admin at ${new Date().toISOString()}` })
        .eq('id', row.id)
      canceled++
    } else {
      failed++
    }
  }

  return NextResponse.json({ ok: true, canceled, failed })
}
