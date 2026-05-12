import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const ALLOWED_TABLES = ['user_process_types', 'user_step_types'] as const
type AllowedTable = typeof ALLOWED_TABLES[number]
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') return null
  return user
}

// POST: criar tipo para um usuário
export async function POST(request: Request) {
  const actor = await verifyAdmin()
  if (!actor) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: { table?: unknown; user_id?: unknown; label?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Payload inválido' }, { status: 400 }) }

  const { table, user_id, label } = body

  if (!ALLOWED_TABLES.includes(table as AllowedTable))
    return NextResponse.json({ error: 'Tabela inválida' }, { status: 400 })
  if (typeof user_id !== 'string' || !UUID_RE.test(user_id))
    return NextResponse.json({ error: 'user_id inválido' }, { status: 400 })
  if (typeof label !== 'string' || !label.trim() || label.trim().length > 80)
    return NextResponse.json({ error: 'Label inválido (máx. 80 caracteres)' }, { status: 400 })

  const admin = serviceClient()
  const { data, error } = await admin
    .from(table as string)
    .insert({ user_id, label: label.trim() })
    .select('id, created_at')
    .single()

  if (error) {
    console.error('[admin/types POST]', error.message)
    return NextResponse.json({ error: 'Erro ao criar tipo.' }, { status: 400 })
  }

  await logAudit({
    actorId: actor.id, action: 'type_created',
    targetId: user_id, targetType: table as string,
    metadata: { label: label.trim() },
  })

  return NextResponse.json({ id: data.id, created_at: data.created_at })
}

// PATCH: renomear tipo + cascata nos registros existentes
export async function PATCH(request: Request) {
  const actor = await verifyAdmin()
  if (!actor) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: { table?: unknown; id?: unknown; label?: unknown; old_label?: unknown; user_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Payload inválido' }, { status: 400 }) }

  const { table, id, label, old_label, user_id } = body

  if (!ALLOWED_TABLES.includes(table as AllowedTable))
    return NextResponse.json({ error: 'Tabela inválida' }, { status: 400 })
  if (typeof id !== 'string' || !UUID_RE.test(id))
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  if (typeof user_id !== 'string' || !UUID_RE.test(user_id))
    return NextResponse.json({ error: 'user_id inválido' }, { status: 400 })
  if (typeof label !== 'string' || !label.trim() || label.trim().length > 80)
    return NextResponse.json({ error: 'Label inválido (máx. 80 caracteres)' }, { status: 400 })
  if (typeof old_label !== 'string')
    return NextResponse.json({ error: 'old_label ausente' }, { status: 400 })

  const newLabel = label.trim()
  const admin = serviceClient()

  const { error } = await admin.from(table as string).update({ label: newLabel }).eq('id', id)
  if (error) {
    console.error('[admin/types PATCH]', error.message)
    return NextResponse.json({ error: 'Erro ao atualizar tipo.' }, { status: 400 })
  }

  // Cascata: atualiza registros existentes que usam o label antigo
  if (table === 'user_process_types') {
    await admin.from('processes').update({ type: newLabel }).eq('type', old_label).eq('owner_id', user_id)
  } else {
    const { data: procs } = await admin.from('processes').select('id').eq('owner_id', user_id)
    if (procs && procs.length > 0) {
      const ids = procs.map((p: { id: string }) => p.id)
      await admin.from('steps').update({ step_type: newLabel }).eq('step_type', old_label).in('process_id', ids)
    }
  }

  await logAudit({
    actorId: actor.id, action: 'type_updated',
    targetId: user_id, targetType: table as string,
    metadata: { old_label, new_label: newLabel },
  })

  return NextResponse.json({ ok: true })
}

// DELETE: remover tipo
export async function DELETE(request: Request) {
  const actor = await verifyAdmin()
  if (!actor) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: { table?: unknown; id?: unknown; label?: unknown; user_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Payload inválido' }, { status: 400 }) }

  const { table, id, label, user_id } = body

  if (!ALLOWED_TABLES.includes(table as AllowedTable))
    return NextResponse.json({ error: 'Tabela inválida' }, { status: 400 })
  if (typeof id !== 'string' || !UUID_RE.test(id))
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  if (typeof user_id !== 'string' || !UUID_RE.test(user_id))
    return NextResponse.json({ error: 'user_id inválido' }, { status: 400 })

  const admin = serviceClient()
  const { error } = await admin.from(table as string).delete().eq('id', id)

  if (error) {
    console.error('[admin/types DELETE]', error.message)
    return NextResponse.json({ error: 'Erro ao excluir tipo.' }, { status: 400 })
  }

  await logAudit({
    actorId: actor.id, action: 'type_deleted',
    targetId: user_id, targetType: table as string,
    metadata: { label },
  })

  return NextResponse.json({ ok: true })
}
