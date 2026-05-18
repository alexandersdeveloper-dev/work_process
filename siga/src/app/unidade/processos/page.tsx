export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProcessesClient from '@/app/processes/ProcessesClient'
import type { Process } from '@/types'

export default async function UnidadeProcessosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('processes')
    .select('id, title, type, priority, status, responsible, deadline, description, portal_section, created_at, updated_at, owner_id')
    .order('created_at', { ascending: false })

  return (
    <ProcessesClient
      mode="unit"
      title="Processos da Unidade"
      subtitle="Todos os processos de trabalho da secretaria"
      initialProcesses={(data as Process[]) ?? []}
    />
  )
}
