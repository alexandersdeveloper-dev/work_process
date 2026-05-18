import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { KanbanShare } from '@/types'

async function fetchKanbanShares(cardId: string): Promise<KanbanShare[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('kanban_shares')
    .select('id, card_id, shared_with_user_id, shared_by_user_id, created_at, profile:profiles!kanban_shares_shared_with_user_id_fkey(id, full_name, role, cargo, created_at, updated_at)')
    .eq('card_id', cardId)
  return (data as unknown as KanbanShare[]) ?? []
}

export function useKanbanShares(cardId: string) {
  return useQuery<KanbanShare[]>({
    queryKey: queryKeys.kanbanShares(cardId),
    queryFn: () => fetchKanbanShares(cardId),
    staleTime: 30 * 1000,
    enabled: !!cardId,
  })
}
