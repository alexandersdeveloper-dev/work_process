import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { headers } from 'next/headers'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_TYPES = ['feriado', 'ponto_facultativo'] as const
const ALLOWED_SCOPES = ['nacional', 'estadual', 'municipal'] as const
const ALLOWED_RECURRENCES = ['anual', 'pontual', 'movel'] as const
const ALLOWED_IMPACTS = ['visualizacao', 'alerta', 'bloqueio'] as const

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') return null
  return user
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { name, type, scope, recurrence, month, day, week_of_month, weekday, date, impact, active } = body
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120)
      return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
    patch.name = name.trim()
  }
  if (type !== undefined) {
    if (!(ALLOWED_TYPES as readonly string[]).includes(type as string))
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
    patch.type = type
  }
  if (scope !== undefined) {
    if (!(ALLOWED_SCOPES as readonly string[]).includes(scope as string))
      return NextResponse.json({ error: 'Abrangência inválida.' }, { status: 400 })
    patch.scope = scope
  }
  if (recurrence !== undefined) {
    if (!(ALLOWED_RECURRENCES as readonly string[]).includes(recurrence as string))
      return NextResponse.json({ error: 'Recorrência inválida.' }, { status: 400 })
    patch.recurrence = recurrence
  }
  if (impact !== undefined) {
    if (!(ALLOWED_IMPACTS as readonly string[]).includes(impact as string))
      return NextResponse.json({ error: 'Impacto inválido.' }, { status: 400 })
    patch.impact = impact
  }
  if (active !== undefined) {
    patch.active = active === true
  }

  const finalRecurrence = (patch.recurrence ?? recurrence) as string | undefined

  if (finalRecurrence === 'anual') {
    if (month !== undefined) {
      if (typeof month !== 'number' || month < 1 || month > 12)
        return NextResponse.json({ error: 'Mês inválido.' }, { status: 400 })
      patch.month = month
    }
    if (day !== undefined) {
      if (typeof day !== 'number' || day < 1 || day > 31)
        return NextResponse.json({ error: 'Dia inválido.' }, { status: 400 })
      patch.day = day
    }
    patch.date = null
    patch.week_of_month = null
    patch.weekday = null
  } else if (finalRecurrence === 'movel') {
    if (month !== undefined) {
      if (typeof month !== 'number' || month < 1 || month > 12)
        return NextResponse.json({ error: 'Mês inválido.' }, { status: 400 })
      patch.month = month
    }
    if (week_of_month !== undefined) {
      if (typeof week_of_month !== 'number' || week_of_month < 1 || week_of_month > 4)
        return NextResponse.json({ error: 'Semana inválida (1–4).' }, { status: 400 })
      patch.week_of_month = week_of_month
    }
    if (weekday !== undefined) {
      if (typeof weekday !== 'number' || weekday < 0 || weekday > 6)
        return NextResponse.json({ error: 'Dia da semana inválido.' }, { status: 400 })
      patch.weekday = weekday
    }
    patch.date = null
    patch.day = null
  } else if (finalRecurrence === 'pontual') {
    if (date !== undefined) {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return NextResponse.json({ error: 'Data inválida.' }, { status: 400 })
      patch.date = date
    }
    patch.month = null
    patch.day = null
    patch.week_of_month = null
    patch.weekday = null
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const { error } = await serviceClient()
    .from('feriados')
    .update(patch)
    .eq('id', id)

  if (error) {
    console.error('[admin/feriados PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar feriado.' }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    action: 'feriado_updated',
    targetId: id,
    targetType: 'feriado',
    metadata: patch,
    ipAddress: ip,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const { error } = await serviceClient()
    .from('feriados')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/feriados DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir feriado.' }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    action: 'feriado_deleted',
    targetId: id,
    targetType: 'feriado',
    ipAddress: ip,
  })

  return NextResponse.json({ ok: true })
}
