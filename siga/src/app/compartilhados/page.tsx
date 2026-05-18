export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProcessesClient from '@/app/processes/ProcessesClient'
import type { Process } from '@/types'

const PROCESS_SELECT = 'id, title, type, priority, status, responsible, deadline, description, portal_section, created_at, updated_at, owner_id'

export default async function CompartilhadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shares } = await supabase
    .from('process_shares')
    .select('process_id')
    .eq('shared_with_user_id', user.id)

  const ids = (shares ?? []).map((s: { process_id: string }) => s.process_id)

  let initialProcesses: Process[] = []
  if (ids.length > 0) {
    const { data } = await supabase
      .from('processes')
      .select(PROCESS_SELECT)
      .in('id', ids)
      .order('updated_at', { ascending: false })
    initialProcesses = (data as Process[]) ?? []
  }

  return (
    <ProcessesClient
      mode="shared"
      title="Compartilhados"
      subtitle="Processos que outros usuários compartilharam com você"
      initialProcesses={initialProcesses}
    />
  )
}
