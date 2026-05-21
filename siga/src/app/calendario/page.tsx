export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CalendarioClient from './CalendarioClient'
import type { Folga, ProcessDeadline } from '@/types'

export default async function CalendarioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profileData?.role ?? 'servidor'

  const folgasQuery = supabase
    .from('folgas')
    .select('id, user_id, date, end_date, type, description, registered_by, created_at, profile:profiles!folgas_user_id_fkey(id, full_name, cargo)')
    .order('date', { ascending: true })

  let processesQuery = supabase
    .from('processes')
    .select('id, title, type, status, priority, deadline, owner_id')
    .not('deadline', 'is', null)
    .not('status', 'in', '("done","cancelled","completed")')

  if (role === 'servidor') {
    const { data: shares } = await supabase
      .from('process_shares')
      .select('process_id')
      .eq('shared_with_user_id', user.id)
    const sharedIds = (shares ?? []).map((s: { process_id: string }) => s.process_id)
    const filters = [`owner_id.eq.${user.id}`, ...(sharedIds.length > 0 ? [`id.in.(${sharedIds.join(',')})`] : [])]
    processesQuery = processesQuery.or(filters.join(','))
  }

  const [{ data: folgasData }, { data: deadlinesData }] = await Promise.all([
    folgasQuery,
    processesQuery.order('deadline', { ascending: true }),
  ])

  return (
    <CalendarioClient
      initialFolgas={(folgasData as unknown as Folga[]) ?? []}
      initialDeadlines={(deadlinesData as ProcessDeadline[]) ?? []}
    />
  )
}
