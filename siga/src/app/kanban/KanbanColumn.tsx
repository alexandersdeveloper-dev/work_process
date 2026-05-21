'use client'

import { memo } from 'react'
import KanbanCardItem from './KanbanCardItem'
import type { KanbanCardWithShare, KanbanColumnKey } from '@/types'

interface Props {
  columnKey: KanbanColumnKey
  label: string
  cards: KanbanCardWithShare[]
  today: string
  draggingCardId: string | null
  isDragOver: boolean
  onDragOver: (e: React.DragEvent, col: KanbanColumnKey) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, col: KanbanColumnKey) => void
  onCardDragStart: (card: KanbanCardWithShare) => void
  onEdit: (card: KanbanCardWithShare) => void
  onShare: (card: KanbanCardWithShare) => void
  onDelete: (cardId: string) => void
  onMove: (cardId: string, col: KanbanColumnKey) => void
  onAddCard: (col: KanbanColumnKey) => void
}

function KanbanColumn({
  columnKey, label, cards, today, draggingCardId, isDragOver,
  onDragOver, onDragLeave, onDrop, onCardDragStart,
  onEdit, onShare, onDelete, onMove, onAddCard,
}: Props) {
  return (
    <div
      className={`kanban-col${isDragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e, columnKey) }}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, columnKey)}
    >
      <div className="kanban-col-h">
        <span className="kanban-col-h-label">{label}</span>
        <span className="kanban-col-count">{cards.length}</span>
      </div>

      <div className="kanban-col-body">
        {cards.length === 0 && (
          <div className="kanban-col-empty">
            {columnKey === 'todo' ? 'Clique em + para adicionar o primeiro card' : 'Nenhum card'}
          </div>
        )}

        {cards.map((card) => (
          <KanbanCardItem
            key={card.id}
            card={card}
            today={today}
            isDragging={card.id === draggingCardId}
            onEdit={onEdit}
            onShare={onShare}
            onDelete={onDelete}
            onMove={onMove}
            onDragStart={onCardDragStart}
          />
        ))}

        <button
          className="kanban-add-btn"
          onClick={() => onAddCard(columnKey)}
        >
          + Adicionar card
        </button>
      </div>
    </div>
  )
}

export default memo(KanbanColumn)
