import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Search { token?: string }
interface Props { searchParams: Promise<Search> }

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminSmsPage({ searchParams }: Props) {
  const { token } = await searchParams
  if (!process.env.ADMIN_SECRET || token !== process.env.ADMIN_SECRET) notFound()

  const { data: scheduled } = await supabaseAdmin
    .from('scheduled_messages')
    .select('id, session_title, session_start_at, reminder_at')
    .order('session_start_at', { ascending: true })

  const { data: sends } = await supabaseAdmin
    .from('message_sends')
    .select('scheduled_message_id, status')

  const counts = new Map<string, Record<string, number>>()
  for (const s of sends ?? []) {
    const b = counts.get(s.scheduled_message_id) ?? {}
    b[s.status] = (b[s.status] ?? 0) + 1
    counts.set(s.scheduled_message_id, b)
  }

  const { data: cfg } = await supabaseAdmin
    .from('sms_config').select('killswitch').eq('id', 1).single()

  const totalRegistrants = sends
    ? new Set(sends.map(s => s.scheduled_message_id)).size
    : 0

  return (
    <main style={{ fontFamily: 'system-ui', padding: '24px 16px', maxWidth: 700, margin: '0 auto', color: '#111' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>SMS Reminders</h1>
      <p style={{ fontSize: 16, marginBottom: 24, color: cfg?.killswitch ? '#c00' : '#080' }}>
        Killswitch: <strong>{cfg?.killswitch ? '🔴 ON — publishing halted' : '🟢 off'}</strong>
      </p>

      {(scheduled ?? []).map(sm => {
        const c = counts.get(sm.id) ?? {}
        const total = Object.values(c).reduce((a, b) => a + b, 0)
        const delivered = c.delivered ?? 0
        const published = c.published ?? 0
        const failed = (c.failed ?? 0) + (c.publish_rejected ?? 0)
        const pending = c.pending ?? 0
        const skipped = c.skipped_too_late ?? 0
        const canceled = c.canceled ?? 0

        const bg = failed > 0 ? '#fff0f0'
          : delivered > 0 && pending === 0 && published === 0 ? '#f0fff4'
          : published > 0 ? '#fffbe6'
          : '#f9f9f9'

        return (
          <div key={sm.id} style={{
            background: bg, border: '1px solid #ddd', borderRadius: 10,
            padding: '14px 18px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
              <strong style={{ fontSize: 17 }}>{sm.session_title}</strong>
              <span style={{ fontSize: 13, color: '#555' }}>
                {fmt(sm.session_start_at)} · reminder {fmt(sm.reminder_at)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap', fontSize: 15 }}>
              {total === 0
                ? <span style={{ color: '#999' }}>No sends yet</span>
                : <>
                    {pending   > 0 && <span>⏳ {pending} pending</span>}
                    {published > 0 && <span>📤 {published} published</span>}
                    {delivered > 0 && <span style={{ color: '#080' }}>✅ {delivered} delivered</span>}
                    {failed    > 0 && <span style={{ color: '#c00' }}>❌ {failed} failed</span>}
                    {skipped   > 0 && <span style={{ color: '#888' }}>⏭ {skipped} skipped</span>}
                    {canceled  > 0 && <span style={{ color: '#888' }}>🚫 {canceled} canceled</span>}
                  </>
              }
            </div>
          </div>
        )
      })}

      {(scheduled ?? []).length === 0 && (
        <p style={{ color: '#888' }}>No sessions published yet. Run publish-all to populate.</p>
      )}

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Commands</h2>
      <pre style={{ background: '#f4f4f4', padding: 14, borderRadius: 8, fontSize: 13, overflowX: 'auto', lineHeight: 1.6 }}>
{`# Publish all reminders (run April 24 morning)
curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  https://xaura-sapphire-yildizberkks-projects.vercel.app/api/admin/sms/publish-all

# Preflight test (sends SMS ~15 min from now)
curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  -H "Content-Type: application/json" -d '{"phone":"+90..."}' \\
  https://xaura-sapphire-yildizberkks-projects.vercel.app/api/admin/sms/preflight

# Toggle killswitch
curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  -H "Content-Type: application/json" -d '{"on":true}' \\
  https://xaura-sapphire-yildizberkks-projects.vercel.app/api/admin/sms/killswitch`}
      </pre>
    </main>
  )
}
