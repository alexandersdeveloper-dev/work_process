import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { validatePassword } from '@/lib/password-policy'
import { checkRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'
import { headers } from 'next/headers'

const ALLOWED_ROLES = ['admin', 'chefe', 'servidor'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  // Rate limit: 10 criações por hora por IP
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkRateLimit(`admin_create:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
    )
  }

  // Autenticação e autorização
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  // Parse e validação do payload
  let body: { email?: unknown; password?: unknown; full_name?: unknown; role?: unknown; cargo?: unknown; force_password_change?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const { email, password, full_name, role, cargo, force_password_change } = body

  if (typeof email !== 'string' || !email.trim() || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }
  if (typeof full_name !== 'string' || full_name.trim().length < 3 || full_name.trim().length > 120) {
    return NextResponse.json({ error: 'Nome deve ter entre 3 e 120 caracteres.' }, { status: 400 })
  }
  if (typeof password !== 'string') {
    return NextResponse.json({ error: 'Senha inválida.' }, { status: 400 })
  }
  const pwCheck = validatePassword(password)
  if (!pwCheck.valid) {
    return NextResponse.json({ error: pwCheck.error }, { status: 400 })
  }
  if (typeof role !== 'string' || !(ALLOWED_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 })
  }
  if (cargo !== null && cargo !== undefined && (typeof cargo !== 'string' || cargo.length > 120)) {
    return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 })
  }

  // Criação do usuário via service role
  const admin = serviceClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name.trim(),
      force_password_change: force_password_change === true,
    },
  })

  if (error) {
    console.error('[admin/users POST] createUser error:', error.message)
    const msg = error.message.includes('already registered')
      ? 'Este e-mail já está cadastrado.'
      : 'Erro ao criar usuário. Tente novamente.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  await admin
    .from('profiles')
    .update({
      full_name: full_name.trim(),
      role,
      cargo: typeof cargo === 'string' ? cargo.trim() || null : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.user.id)

  await logAudit({
    actorId: user.id,
    action: 'user_created',
    targetId: data.user.id,
    targetType: 'user',
    metadata: { email: email.trim(), role },
    ipAddress: ip,
  })

  return NextResponse.json({ id: data.user.id })
}
