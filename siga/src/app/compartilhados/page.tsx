export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProcessesClient from '@/app/processes/ProcessesClient'
import type { Process } from '@/types'

export default async function CompartilhadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: shares } = await supabase
    .from('process_shares')
    .select('process_id')
    .eq('shared_with_user_id', user.id)

  const ids = (shares ?? []).map((s: { process_id: string }) => s.process_id)

  const processes: Process[] = ids.length > 0
    ? ((await supabase
        .from('processes')
        .select('*')
        .in('id', ids)
        .order('updated_at', { ascending: false })
      ).data as Process[]) ?? []
    : []

  return (
    <ProcessesClient
      processes={processes}
      title="Compartilhados"
      subtitle="Processos que outros usuários compartilharam com você"
    />
  )
}
