export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProcessesClient from '@/app/processes/ProcessesClient'
import type { Process } from '@/types'

export default async function UnidadeProcessosPage() {
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('processes')
    .select('*')
    .order('created_at', { ascending: false })

  const processes = (data as Process[]) ?? []

  return (
    <ProcessesClient
      processes={processes}
      title="Processos da Unidade"
      subtitle="Todos os processos de trabalho da secretaria"
    />
  )
}
