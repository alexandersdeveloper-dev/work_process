'use client'

import { memo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { KANBAN_COLUMNS, PRIORITY_LABELS, PRIORITY_KIND } from '@/types'
import type { KanbanCardWithShare, KanbanColumnKey } from '@/types'

interface Props {
  card: KanbanCardWithShare
  today: string
  isDragging: boolean
  onEdit: (card: KanbanCardWithShare) => void
  onShare: (card: KanbanCardWithShare) => void
  onDelete: (cardId: string) => void
  onMove: (cardId: string, col: KanbanColumnKey) => void
  onDragStart: (card: KanbanCardWithShare) => void
}

function KanbanCardItem({ card, today, isDragging, onEdit, onShare, onDelete, onMove, onDragStart }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!confirming) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setConfirming(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirming])

  const isOverdue =
    !!card.due_date &&
    card.column_key !== 'done' &&
    card.due_date < today

  const otherColumns = KANBAN_COLUMNS.filter((c) => c.key !== card.column_key)

  return (
    <>
      <div
        className={`kanban-card${isDragging ? ' dragging' : ''}${!card.is_owner ? ' shared-card' : ''}`}
        draggable={card.is_owner}
        onDragStart={card.is_owner ? () => onDragStart(card) : undefined}
      >
        {card.color && <div className={`kc-color-strip kc-color-${card.color}`} />}

        <div className="kc-body">
          <div className="kc-title">{card.title}</div>
          {card.description && <div className="kc-desc">{card.description}</div>}

          <div className="kc-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {card.priority && (
                <span className={`pill sm ${PRIORITY_KIND[card.priority]}`} style={{ fontSize: 10, padding: '1px 7px' }}>
                  {PRIORITY_LABELS[card.priority]}
                </span>
              )}
              {card.due_date && (
                <span className={`kc-meta${isOverdue ? ' overdue' : ''}`} suppressHydrationWarning>
                  {isOverdue ? '⚠ ' : ''}{new Date(card.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              )}
            </div>
            {!card.is_owner && card.shared_by && (
              <span className="kc-shared-badge" title={`Compartilhado por ${card.shared_by.full_name}`}>
                por {card.shared_by.full_name}
              </span>
            )}
          </div>
        </div>

        {card.is_owner && (
          <div className="kc-actions">
            <button className="kc-action-btn" onClick={() => onEdit(card)}>Editar</button>
            <button className="kc-action-btn" onClick={() => onShare(card)}>Compartilhar</button>
            {otherColumns.length > 0 && (
              <select
                className="kc-move-select"
                value=""
                onChange={(e) => { if (e.target.value) onMove(card.id, e.target.value as KanbanColumnKey) }}
                title="Mover para…"
              >
                <option value="" disabled>Mover…</option>
                {otherColumns.map((col) => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            )}
            <button className="kc-action-btn danger" onClick={() => setConfirming(true)}>Excluir</button>
          </div>
        )}
      </div>

      {mounted && confirming && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'modal-bg-in 0.18s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirming(false) }}
        >
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            width: '100%',
            maxWidth: 400,
            padding: 24,
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Excluir card?</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 20 }}>
              "{card.title}" será excluído permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setConfirming(false)}>Cancelar</button>
              <button
                className="btn danger"
                onClick={() => { setConfirming(false); onDelete(card.id) }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default memo(KanbanCardItem)
