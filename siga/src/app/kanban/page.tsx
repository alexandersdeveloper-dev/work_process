export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { KanbanCard, KanbanCardWithShare } from '@/types'
import KanbanClient from './KanbanClient'

async function getKanbanCards(userId: string): Promise<KanbanCardWithShare[]> {
  const supabase = await createServerSupabaseClient()

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

  const ownCards: KanbanCardWithShare[] = (own ?? []).map((c) => ({
    ...(c as unknown as KanbanCard),
    is_owner: true,
    shared_by: null,
  }))

  const sharedCards: KanbanCardWithShare[] = (shared ?? [])
    .filter((s) => s.card)
    .map((s) => ({
      ...(s.card as unknown as KanbanCard),
      is_owner: false,
      shared_by: (s.shared_by as unknown as { id: string; full_name: string }) ?? null,
    }))

  return [...ownCards, ...sharedCards]
}

export default async function KanbanPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const initialCards = await getKanbanCards(user.id)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kanban</h1>
          <p className="sub">Organize suas tarefas em colunas</p>
        </div>
      </div>
      <KanbanClient initialCards={initialCards} userId={user.id} />
    </>
  )
}
