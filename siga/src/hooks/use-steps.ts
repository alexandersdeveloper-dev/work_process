import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { Step } from '@/types'

async function fetchSteps(processId: string, stepIds?: string[] | null): Promise<Step[]> {
  const supabase = createClient()
  let query = supabase
    .from('steps')
    .select('id, title, description, step_type, performed_by, reference_link, created_at, updated_at, mark_state, process_id')
    .eq('process_id', processId)
    .order('created_at', { ascending: true })
  if (stepIds && stepIds.length > 0) query = query.in('id', stepIds)
  const { data } = await query
  return data ?? []
}

export function useSteps(processId: string, stepIds?: string[] | null, initialSteps?: Step[]) {
  return useQuery<Step[]>({
    queryKey: queryKeys.steps(processId),
    queryFn: () => fetchSteps(processId, stepIds),
    initialData: initialSteps,
    initialDataUpdatedAt: initialSteps ? Date.now() : undefined,
    staleTime: 30 * 1000,
  })
}
