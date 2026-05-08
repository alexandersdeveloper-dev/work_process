import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { validatePassword } from '@/lib/password-policy'
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: actorProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if ((actorProfile as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  let body: { password?: string; forceChange?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const { password, forceChange } = body

  if (!password && forceChange === undefined) {
    return NextResponse.json({ error: 'Nenhuma alteração informada.' }, { status: 400 })
  }

  if (password) {
    const { valid, error: pwErr } = validatePassword(password)
    if (!valid) return NextResponse.json({ error: pwErr }, { status: 400 })
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const admin = serviceClient()
  const updatePayload: { password?: string; user_metadata?: Record<string, unknown> } = {}
  if (password) updatePayload.password = password
  if (forceChange !== undefined) updatePayload.user_metadata = { force_password_change: forceChange }

  const { error } = await admin.auth.admin.updateUserById(id, updatePayload)
  if (error) {
    console.error('[admin/users PATCH] updateUserById error:', error.message)
    return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 400 })
  }

  await logAudit({
    actorId: user.id,
    action: 'password_changed',
    targetId: id,
    targetType: 'user',
    metadata: { forceChange: forceChange ?? false },
    ipAddress: ip,
  })

  return NextResponse.json({ ok: true })
}
