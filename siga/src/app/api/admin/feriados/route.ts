import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { headers } from 'next/headers'

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

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { data, error } = await serviceClient()
    .from('feriados')
    .select('*')
    .order('active', { ascending: false })
    .order('recurrence', { ascending: false })
    .order('month', { ascending: true, nullsFirst: false })
    .order('date', { ascending: true, nullsFirst: false })
    .order('name')

  if (error) {
    console.error('[admin/feriados GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar feriados.' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { name, type, scope, recurrence, month, day, week_of_month, weekday, date, impact, active } = body

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120)
    return NextResponse.json({ error: 'Nome inválido (2–120 caracteres).' }, { status: 400 })
  if (typeof type !== 'string' || !(ALLOWED_TYPES as readonly string[]).includes(type))
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
  if (typeof scope !== 'string' || !(ALLOWED_SCOPES as readonly string[]).includes(scope))
    return NextResponse.json({ error: 'Abrangência inválida.' }, { status: 400 })
  if (typeof recurrence !== 'string' || !(ALLOWED_RECURRENCES as readonly string[]).includes(recurrence))
    return NextResponse.json({ error: 'Recorrência inválida.' }, { status: 400 })
  if (typeof impact !== 'string' || !(ALLOWED_IMPACTS as readonly string[]).includes(impact))
    return NextResponse.json({ error: 'Impacto inválido.' }, { status: 400 })

  let validatedMonth: number | null = null
  let validatedDay: number | null = null
  let validatedWeekOfMonth: number | null = null
  let validatedWeekday: number | null = null
  let validatedDate: string | null = null

  if (recurrence === 'anual') {
    if (typeof month !== 'number' || month < 1 || month > 12)
      return NextResponse.json({ error: 'Mês inválido para recorrência anual.' }, { status: 400 })
    if (typeof day !== 'number' || day < 1 || day > 31)
      return NextResponse.json({ error: 'Dia inválido para recorrência anual.' }, { status: 400 })
    validatedMonth = month
    validatedDay = day
  } else if (recurrence === 'movel') {
    if (typeof month !== 'number' || month < 1 || month > 12)
      return NextResponse.json({ error: 'Mês inválido para recorrência móvel.' }, { status: 400 })
    if (typeof week_of_month !== 'number' || week_of_month < 1 || week_of_month > 4)
      return NextResponse.json({ error: 'Semana inválida (1–4).' }, { status: 400 })
    if (typeof weekday !== 'number' || weekday < 0 || weekday > 6)
      return NextResponse.json({ error: 'Dia da semana inválido (0–6).' }, { status: 400 })
    validatedMonth = month
    validatedWeekOfMonth = week_of_month
    validatedWeekday = weekday
  } else {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return NextResponse.json({ error: 'Data inválida para recorrência pontual.' }, { status: 400 })
    validatedDate = date
  }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  const { data: inserted, error } = await serviceClient()
    .from('feriados')
    .insert({
      name: name.trim(),
      type,
      scope,
      recurrence,
      month: validatedMonth,
      day: validatedDay,
      week_of_month: validatedWeekOfMonth,
      weekday: validatedWeekday,
      date: validatedDate,
      impact,
      active: active !== false,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[admin/feriados POST]', error)
    return NextResponse.json({ error: 'Erro ao criar feriado.' }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    action: 'feriado_created',
    targetId: inserted.id,
    targetType: 'feriado',
    metadata: { name: name.trim(), type, scope, recurrence, impact },
    ipAddress: ip,
  })

  return NextResponse.json({ id: inserted.id }, { status: 201 })
}
