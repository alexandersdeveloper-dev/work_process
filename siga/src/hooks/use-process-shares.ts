import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { ProcessShare } from '@/types'

/** Retorna os compartilhamentos de um processo, com cache de 30 seg. */
export function useProcessShares(processId: string, initialData?: ProcessShare[]) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.processShares(processId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_shares')
        .select('id, process_id, shared_with_user_id, shared_by_user_id, step_ids, created_at, profile:profiles!process_shares_shared_with_user_id_fkey(id, full_name, role, cargo)')
        .eq('process_id', processId)
      if (error) throw error
      return (data ?? []) as ProcessShare[]
    },
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })
}
