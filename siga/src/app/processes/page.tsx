export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import ProcessesClient from './ProcessesClient'
import type { Process } from '@/types'

async function getProcesses(status?: string): Promise<Process[]> {
  let query = supabase.from('processes').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data } = await query
  return data ?? []
}

async function getCounts() {
  const { data } = await supabase.from('processes').select('status')
  if (!data) return { all: 0, active: 0, in_progress: 0, delayed: 0, completed: 0 }
  return {
    all: data.length,
    active: data.filter((p) => p.status === 'active').length,
    in_progress: data.filter((p) => p.status === 'in_progress').length,
    delayed: data.filter((p) => p.status === 'delayed').length,
    completed: data.filter((p) => p.status === 'completed').length,
  }
}

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const activeTab = params.status ?? 'all'
  const [processes, counts] = await Promise.all([getProcesses(activeTab), getCounts()])

  return (
    <ProcessesClient
      processes={processes}
      counts={counts}
      activeTab={activeTab}
    />
  )
}
