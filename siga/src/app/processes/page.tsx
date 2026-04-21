export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import ProcessesClient from './ProcessesClient'
import type { Process } from '@/types'

async function getAllProcesses(): Promise<Process[]> {
  const { data } = await supabase
    .from('processes')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function ProcessesPage() {
  const processes = await getAllProcesses()
  return <ProcessesClient processes={processes} />
}
