import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { headers } from 'next/headers'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (user.id === id) return NextResponse.json({ error: 'Não é possível excluir a própria conta.' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const admin = serviceClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    console.error('[admin/users DELETE] deleteUser error:', error.message)
    return NextResponse.json({ error: 'Erro ao excluir usuário.' }, { status: 400 })
  }

  await logAudit({
    actorId: user.id,
    action: 'user_deleted',
    targetId: id,
    targetType: 'user',
    ipAddress: ip,
  })

  return NextResponse.json({ ok: true })
}
