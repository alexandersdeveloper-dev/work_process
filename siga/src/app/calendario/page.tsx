export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import CalendarioClient from './CalendarioClient'
import type { Folga } from '@/types'

export type ProcessDeadline = {
  id: string
  title: string
  type: string
  status: string
  priority: string
  deadline: string
}

async function getFolgas(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<Folga[]> {
  const { data } = await supabase
    .from('folgas')
    .select('id, user_id, date, end_date, type, description, registered_by, created_at, profile:profiles!folgas_user_id_fkey(id, full_name, cargo)')
    .order('date', { ascending: true })
  return (data as unknown as Folga[]) ?? []
}

async function getDeadlines(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  uid: string,
  role: string,
): Promise<ProcessDeadline[]> {
  let query = supabase
    .from('processes')
    .select('id, title, type, status, priority, deadline')
    .not('deadline', 'is', null)
    .not('status', 'in', '("done","cancelled")')

  if (role === 'servidor') {
    const { data: shared } = await supabase
      .from('process_shares')
      .select('process_id')
      .eq('shared_with_user_id', uid)
    const sharedIds = (shared ?? []).map((s: { process_id: string }) => s.process_id)
    const filters = [`owner_id.eq.${uid}`, ...(sharedIds.length > 0 ? [`id.in.(${sharedIds.join(',')})`] : [])]
    query = query.or(filters.join(','))
  }

  const { data } = await query.order('deadline', { ascending: true })
  return (data as ProcessDeadline[]) ?? []
}

export default async function CalendarioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single()
  const role = (profileData as { role: string } | null)?.role ?? 'servidor'

  const [folgas, deadlines] = await Promise.all([
    getFolgas(supabase),
    getDeadlines(supabase, uid, role),
  ])

  return <CalendarioClient folgas={folgas} deadlines={deadlines} />
}
