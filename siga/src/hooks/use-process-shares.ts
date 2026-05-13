import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { ProcessShare } from '@/types'

/** Retorna os compartilhamentos de um processo, com cache de 30 seg. */
export function useProcessShares(processId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.processShares(processId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('process_shares')
        .select('*, profile:profiles!process_shares_shared_with_user_id_fkey(*)')
        .eq('process_id', processId)
      if (error) throw error
      return (data ?? []) as ProcessShare[]
    },
    staleTime: 30 * 1000,
  })
}
