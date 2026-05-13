export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import FeriadosClient from './FeriadosClient'
import type { Feriado } from '@/types'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function FeriadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'admin') return notFound()

  const { data } = await serviceClient()
    .from('feriados')
    .select('*')
    .order('active', { ascending: false })
    .order('recurrence', { ascending: false })
    .order('month', { ascending: true, nullsFirst: false })
    .order('date', { ascending: true, nullsFirst: false })
    .order('name')

  return <FeriadosClient initialFeriados={(data ?? []) as Feriado[]} />
}
