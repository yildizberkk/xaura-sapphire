import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Search {
  token?: string
}

interface Props {
  searchParams: Promise<Search>
}

export default async function AdminSmsPage({ searchParams }: Props) {
  const { token } = await searchParams
  if (!process.env.ADMIN_SECRET || token !== process.env.ADMIN_SECRET) {
    notFound()
  }

  const { data: scheduled } = await supabaseAdmin
    .from('scheduled_messages')
    .select('id, day_idx, session_idx, session_title, session_start_at, reminder_at')
    .order('session_start_at', { ascending: true })

  const { data: sends } = await supabaseAdmin
    .from('message_sends')
    .select('scheduled_message_id, status')

  const counts = new Map<string, Record<string, number>>()
  for (const s of sends ?? []) {
    const bucket = counts.get(s.scheduled_message_id) ?? {}
    bucket[s.status] = (bucket[s.status] ?? 0) + 1
    counts.set(s.scheduled_message_id, bucket)
  }

  const { data: cfg } = await supabaseAdmin
    .from('sms_config').select('killswitch').eq('id', 1).single()

  return (
    <main style={{ fontFamily: 'system-ui', padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>SMS Status</h1>
      <p>
        Killswitch: <strong>{cfg?.killswitch ? 'ON (all publishing halted)' : 'off'}</strong>
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Session</th>
            <th>Start (UTC)</th>
            <th>Pending</th>
            <th>Published</th>
            <th>Delivered</th>
            <th>Failed</th>
            <th>Rejected</th>
            <th>Skipped</th>
            <th>Canceled</th>
          </tr>
        </thead>
        <tbody>
          {(scheduled ?? []).map(sm => {
            const c = counts.get(sm.id) ?? {}
            const color =
              (c.publish_rejected || c.failed) ? '#fee' :
              (c.pending || c.published)       ? '#ffe' :
                                                 '#efe'
            return (
              <tr key={sm.id} style={{ background: color, borderBottom: '1px solid #eee' }}>
                <td>{sm.session_title}</td>
                <td>{new Date(sm.session_start_at).toISOString().slice(0, 16)}</td>
                <td>{c.pending ?? 0}</td>
                <td>{c.published ?? 0}</td>
                <td>{c.delivered ?? 0}</td>
                <td>{c.failed ?? 0}</td>
                <td>{c.publish_rejected ?? 0}</td>
                <td>{c.skipped_too_late ?? 0}</td>
                <td>{c.canceled ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h2 style={{ marginTop: 32 }}>Admin commands</h2>
      <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>
{`curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  https://<host>/api/admin/sms/publish-all

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  "https://<host>/api/admin/sms/cancel?scheduled_message_id=<id>"

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  "https://<host>/api/admin/sms/resend?message_send_id=<id>"

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  -H "Content-Type: application/json" -d '{"on":true}' \\
  https://<host>/api/admin/sms/killswitch

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  -H "Content-Type: application/json" -d '{"phone":"+90..."}' \\
  https://<host>/api/admin/sms/preflight`}
      </pre>
    </main>
  )
}
