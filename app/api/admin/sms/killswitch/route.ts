import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const body = await request.json().catch(() => null) as { on?: boolean } | null
  if (!body || typeof body.on !== 'boolean') {
    return NextResponse.json({ error: 'body must be {"on": boolean}' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('sms_config')
    .update({ killswitch: body.on, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, killswitch: body.on })
}
