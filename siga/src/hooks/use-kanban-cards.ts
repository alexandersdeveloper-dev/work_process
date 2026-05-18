import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { KanbanCard, KanbanCardWithShare } from '@/types'

async function fetchKanbanCards(userId: string): Promise<KanbanCardWithShare[]> {
  const supabase = createClient()

  const [{ data: own }, { data: shared }] = await Promise.all([
    supabase
      .from('kanban_cards')
      .select('id, title, description, column_key, color, priority, due_date, owner_id, created_at, updated_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true }),
    supabase
      .from('kanban_shares')
      .select('shared_by:profiles!kanban_shares_shared_by_user_id_fkey(id, full_name), card:kanban_cards!kanban_shares_card_id_fkey(id, title, description, column_key, color, priority, due_date, owner_id, created_at, updated_at)')
      .eq('shared_with_user_id', userId),
  ])

  const ownCards: KanbanCardWithShare[] = (own ?? []).map((c: unknown) => ({
    ...(c as KanbanCard),
    is_owner: true,
    shared_by: null,
  }))

  const sharedCards: KanbanCardWithShare[] = (shared ?? [])
    .filter((s: unknown) => (s as { card: unknown }).card)
    .map((s: unknown) => {
      const row = s as { card: unknown; shared_by: unknown }
      return {
        ...(row.card as KanbanCard),
        is_owner: false,
        shared_by: (row.shared_by as { id: string; full_name: string }) ?? null,
      }
    })

  return [...ownCards, ...sharedCards]
}

export function useKanbanCards(userId: string, initialCards?: KanbanCardWithShare[]) {
  return useQuery<KanbanCardWithShare[]>({
    queryKey: queryKeys.kanbanCards(userId),
    queryFn: () => fetchKanbanCards(userId),
    initialData: initialCards,
    initialDataUpdatedAt: initialCards ? Date.now() : undefined,
    staleTime: 30 * 1000,
    enabled: !!userId,
    placeholderData: keepPreviousData,
  })
}
