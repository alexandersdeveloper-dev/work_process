export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProcessesClient from './ProcessesClient'
import type { Process } from '@/types'

async function getMyProcesses(): Promise<Process[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('processes')
    .select('id, title, type, priority, status, responsible, deadline, description, portal_section, created_at, updated_at, owner_id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export default async function ProcessesPage() {
  const processes = await getMyProcesses()
  return <ProcessesClient processes={processes} />
}
