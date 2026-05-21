'use client'

import { memo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PRIORITY_LABELS, PRIORITY_KIND, KANBAN_COLUMNS } from '@/types'
import type { KanbanCardWithShare, KanbanColumnKey } from '@/types'
import ConfirmModal from '@/components/ui/ConfirmModal'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDesc, setShowDesc] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const descRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const el = descRef.current
    if (!el) return
    setHasOverflow(el.scrollHeight > el.clientHeight)
  }, [card.description])

  // Close menu on mousedown outside — checks both button and portal dropdown via refs
  useEffect(() => {
    if (!menuOpen) return
    function close(e: MouseEvent) {
      if (menuBtnRef.current?.contains(e.target as Node)) return
      if (dropdownRef.current?.contains(e.target as Node)) return
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  // ESC closes all overlays
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setConfirming(false)
        setMenuOpen(false)
        setShowDesc(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation()
    if (menuOpen) { setMenuOpen(false); return }
    const btn = menuBtnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMenuOpen(true)
  }

  const isOverdue = !!card.due_date && card.column_key !== 'done' && card.due_date < today

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

          {card.description && (
            <>
              <div ref={descRef} className="kc-desc">{card.description}</div>
              {hasOverflow && (
                <button className="kc-ver-mais" onClick={() => setShowDesc(true)}>
                  ver mais
                </button>
              )}
            </>
          )}

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
          <button
            ref={menuBtnRef}
            className="kc-menu-btn"
            onClick={openMenu}
            title="Ações"
            aria-label="Ações do card"
            aria-expanded={menuOpen}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.3"/>
              <circle cx="8" cy="8" r="1.3"/>
              <circle cx="8" cy="13" r="1.3"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown — Portal global, posicionado via getBoundingClientRect */}
      {mounted && menuOpen && menuPos && createPortal(
        <div
          ref={dropdownRef}
          className="kc-dropdown"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <button className="kc-dropdown-item" onClick={() => { setMenuOpen(false); onEdit(card) }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z"/>
            </svg>
            Editar
          </button>
          <button className="kc-dropdown-item" onClick={() => { setMenuOpen(false); onShare(card) }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="3" r="1.5"/><circle cx="4" cy="8" r="1.5"/><circle cx="12" cy="13" r="1.5"/>
              <path d="M5.5 7.2l5-2.9M5.5 8.8l5 2.9"/>
            </svg>
            Compartilhar
          </button>
          <div className="kc-move-select-wrap">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 2v9M5 8l3 3 3-3M3 13h10" />
            </svg>
            <select
              className="kc-move-select"
              value={card.column_key}
              onChange={(e) => { setMenuOpen(false); onMove(card.id, e.target.value as KanbanColumnKey) }}
            >
              {KANBAN_COLUMNS.map((col) => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>
          <div className="kc-dropdown-sep" />
          <button className="kc-dropdown-item danger" onClick={() => { setMenuOpen(false); setConfirming(true) }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M6 4V2.5h4V4M5.5 4l.5 9.5h4l.5-9.5"/>
            </svg>
            Excluir
          </button>
        </div>,
        document.body
      )}

      {/* Drawer de descrição — Portal global, lateral no desktop, bottom sheet no mobile */}
      {mounted && showDesc && createPortal(
        <>
          <div className="kc-drawer-backdrop" onClick={() => setShowDesc(false)} />
          <div className="kc-drawer" role="dialog" aria-label={`Descrição: ${card.title}`}>
            <div className="kc-drawer-header">
              <h3 className="kc-drawer-title">{card.title}</h3>
              <button className="kc-drawer-close" onClick={() => setShowDesc(false)} aria-label="Fechar">✕</button>
            </div>
            <div className="kc-drawer-body">
              {card.description}
            </div>
          </div>
        </>,
        document.body
      )}

      <ConfirmModal
        open={confirming}
        title="Excluir card?"
        description={`"${card.title}" será excluído permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => { setConfirming(false); onDelete(card.id) }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}

export default memo(KanbanCardItem)
