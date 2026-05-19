'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useKanbanCards } from '@/hooks/use-kanban-cards'
import { queryKeys } from '@/lib/query-keys'
import { useActionLoader } from '@/contexts/ActionLoaderContext'
import { useToast } from '@/contexts/ToastContext'
import { KANBAN_COLUMNS } from '@/types'
import type { KanbanCardWithShare, KanbanColumnKey } from '@/types'
import KanbanColumn from './KanbanColumn'
import KanbanFormModal from './KanbanFormModal'
import KanbanShareModal from './KanbanShareModal'

interface Props {
  initialCards: KanbanCardWithShare[]
  userId: string
}

export default function KanbanClient({ initialCards, userId }: Props) {
  const { data: cards = [] } = useKanbanCards(userId, initialCards)
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { showLoader, hideLoader } = useActionLoader()
  const { showToast } = useToast()

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnKey | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createDefaultCol, setCreateDefaultCol] = useState<KanbanColumnKey>('todo')
  const [editCard, setEditCard] = useState<KanbanCardWithShare | null>(null)
  const [shareCard, setShareCard] = useState<KanbanCardWithShare | null>(null)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const cardsByColumn = useMemo(() => {
    const map = new Map<KanbanColumnKey, KanbanCardWithShare[]>()
    for (const col of KANBAN_COLUMNS) map.set(col.key, [])
    for (const card of cards) {
      const col = map.get(card.column_key)
      if (col) col.push(card)
    }
    return map
  }, [cards])

  const handleMoveCard = useCallback(async (cardId: string, targetColumn: KanbanColumnKey) => {
    const card = cards.find((c) => c.id === cardId)
    if (!card || !card.is_owner || card.column_key === targetColumn) return

    const previousCards = queryClient.getQueryData<KanbanCardWithShare[]>(queryKeys.kanbanCards(userId))

    queryClient.setQueryData<KanbanCardWithShare[]>(
      queryKeys.kanbanCards(userId),
      (old) => (old ?? []).map((c) =>
        c.id === cardId ? { ...c, column_key: targetColumn } : c
      )
    )

    try {
      await supabase
        .from('kanban_cards')
        .update({ column_key: targetColumn, updated_at: new Date().toISOString() })
        .eq('id', cardId)
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanCards(userId) })
    } catch {
      if (previousCards) {
        queryClient.setQueryData(queryKeys.kanbanCards(userId), previousCards)
      }
      showToast('Erro ao mover card.', 'error')
    }
  }, [cards, queryClient, supabase, userId, showToast])

  const handleDeleteCard = useCallback(async (cardId: string) => {
    showLoader()
    const previousCards = queryClient.getQueryData<KanbanCardWithShare[]>(queryKeys.kanbanCards(userId))

    queryClient.setQueryData<KanbanCardWithShare[]>(
      queryKeys.kanbanCards(userId),
      (old) => (old ?? []).filter((c) => c.id !== cardId)
    )

    try {
      await supabase.from('kanban_cards').delete().eq('id', cardId)
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanCards(userId) })
      showToast('Card excluído.')
    } catch {
      if (previousCards) {
        queryClient.setQueryData(queryKeys.kanbanCards(userId), previousCards)
      }
      showToast('Erro ao excluir card.', 'error')
    } finally {
      hideLoader()
    }
  }, [queryClient, supabase, userId, showLoader, hideLoader, showToast])

  const handleDragStart = useCallback((card: KanbanCardWithShare) => {
    setDraggingCardId(card.id)
  }, [])

  const handleDragOver = useCallback((_e: React.DragEvent, col: KanbanColumnKey) => {
    setDragOverCol(col)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null)
  }, [])

  const handleDrop = useCallback((_e: React.DragEvent, col: KanbanColumnKey) => {
    if (draggingCardId) handleMoveCard(draggingCardId, col)
    setDraggingCardId(null)
    setDragOverCol(null)
  }, [draggingCardId, handleMoveCard])

  const handleAddCard = useCallback((col: KanbanColumnKey) => {
    setCreateDefaultCol(col)
    setShowCreateModal(true)
  }, [])

  const handleEdit = useCallback((card: KanbanCardWithShare) => {
    setEditCard(card)
  }, [])

  const handleShare = useCallback((card: KanbanCardWithShare) => {
    setShareCard(card)
  }, [])

  return (
    <>
      <div className="kanban-board">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            columnKey={col.key}
            label={col.label}
            cards={cardsByColumn.get(col.key) ?? []}
            today={today}
            draggingCardId={draggingCardId}
            isDragOver={dragOverCol === col.key}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onCardDragStart={handleDragStart}
            onEdit={handleEdit}
            onShare={handleShare}
            onDelete={handleDeleteCard}
            onAddCard={handleAddCard}
          />
        ))}
      </div>

      {showCreateModal && (
        <KanbanFormModal
          userId={userId}
          defaultColumn={createDefaultCol}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editCard && (
        <KanbanFormModal
          userId={userId}
          card={editCard}
          onClose={() => setEditCard(null)}
        />
      )}

      {shareCard && (
        <KanbanShareModal
          card={shareCard}
          userId={userId}
          onClose={() => setShareCard(null)}
        />
      )}
    </>
  )
}
