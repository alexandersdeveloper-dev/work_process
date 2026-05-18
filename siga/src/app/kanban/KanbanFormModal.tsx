'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { useActionLoader } from '@/contexts/ActionLoaderContext'
import { useToast } from '@/contexts/ToastContext'
import { KANBAN_COLUMNS, KANBAN_COLOR_HEX, PRIORITY_LABELS } from '@/types'
import type { KanbanCardWithShare, KanbanColumnKey, KanbanColor, Priority } from '@/types'

const COLORS: (KanbanColor | null)[] = [null, 'red', 'orange', 'yellow', 'green', 'blue', 'purple']
const PRIORITIES: (Priority | null)[] = [null, 'low', 'medium', 'high', 'urgent']

interface Props {
  userId: string
  card?: KanbanCardWithShare | null
  defaultColumn?: KanbanColumnKey
  onClose: () => void
}

export default function KanbanFormModal({ userId, card, defaultColumn = 'todo', onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState(card?.title ?? '')
  const [description, setDescription] = useState(card?.description ?? '')
  const [column, setColumn] = useState<KanbanColumnKey>(card?.column_key ?? defaultColumn)
  const [priority, setPriority] = useState<Priority | null>(card?.priority ?? null)
  const [dueDate, setDueDate] = useState(card?.due_date ?? '')
  const [color, setColor] = useState<KanbanColor | null>(card?.color ?? null)
  const [titleError, setTitleError] = useState('')

  const supabase = createClient()
  const queryClient = useQueryClient()
  const { showLoader, hideLoader } = useActionLoader()
  const { showToast } = useToast()

  useEffect(() => { setMounted(true) }, [])

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [close])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t) { setTitleError('Título é obrigatório.'); return }
    setTitleError('')
    setSubmitting(true)
    showLoader()

    try {
      if (card) {
        const { data: updated } = await supabase
          .from('kanban_cards')
          .update({
            title: t,
            description: description.trim() || null,
            column_key: column,
            priority: priority ?? null,
            due_date: dueDate || null,
            color: color ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', card.id)
          .select('id, title, description, column_key, color, priority, due_date, owner_id, created_at, updated_at')
          .single()

        if (updated) {
          queryClient.setQueryData<KanbanCardWithShare[]>(
            queryKeys.kanbanCards(userId),
            (old) => (old ?? []).map((c) =>
              c.id === card.id ? { ...c, ...updated, is_owner: true, shared_by: null } : c
            )
          )
        }
        await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanCards(userId) })
        showToast('Card atualizado.')
      } else {
        const { data: created } = await supabase
          .from('kanban_cards')
          .insert({
            title: t,
            description: description.trim() || null,
            column_key: column,
            priority: priority ?? null,
            due_date: dueDate || null,
            color: color ?? null,
            owner_id: userId,
          })
          .select('id, title, description, column_key, color, priority, due_date, owner_id, created_at, updated_at')
          .single()

        if (created) {
          const newCard: KanbanCardWithShare = {
            ...(created as KanbanCardWithShare),
            is_owner: true,
            shared_by: null,
          }
          queryClient.setQueryData<KanbanCardWithShare[]>(
            queryKeys.kanbanCards(userId),
            (old) => [...(old ?? []), newCard]
          )
        }
        await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanCards(userId) })
        showToast('Card criado.')
      }
      close()
    } catch {
      showToast(card ? 'Erro ao atualizar card.' : 'Erro ao criar card.', 'error')
    } finally {
      setSubmitting(false)
      hideLoader()
    }
  }

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'modal-bg-in 0.18s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--line)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>
            {card ? 'Editar card' : 'Novo card'}
          </h3>
          <button
            onClick={close}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}
            aria-label="Fechar"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Título */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Título *</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError('') }}
              placeholder="Título do card"
              autoFocus
              maxLength={200}
            />
            {titleError && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>{titleError}</p>}
          </div>

          {/* Descrição */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Coluna */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Coluna
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {KANBAN_COLUMNS.map((col) => (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => setColumn(col.key)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: column === col.key ? 'var(--accent)' : 'var(--line)',
                    background: column === col.key ? 'var(--accent-soft)' : 'var(--panel-alt)',
                    color: column === col.key ? 'var(--accent)' : 'var(--ink-2)',
                    fontWeight: column === col.key ? 600 : 400,
                    transition: 'all 0.1s',
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prioridade */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Prioridade
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p ?? 'none'}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: priority === p ? 'var(--accent)' : 'var(--line)',
                    background: priority === p ? 'var(--accent-soft)' : 'var(--panel-alt)',
                    color: priority === p ? 'var(--accent)' : 'var(--ink-2)',
                    fontWeight: priority === p ? 600 : 400,
                    transition: 'all 0.1s',
                  }}
                >
                  {p ? PRIORITY_LABELS[p] : 'Nenhuma'}
                </button>
              ))}
            </div>
          </div>

          {/* Prazo */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Prazo</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Cor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Cor
            </span>
            <div className="kc-color-picker">
              {COLORS.map((c) => (
                <button
                  key={c ?? 'none'}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`kc-color-dot${c === null ? ' none' : ''}${color === c ? ' selected' : ''}`}
                  style={c ? { background: KANBAN_COLOR_HEX[c] } : undefined}
                  title={c ?? 'Sem cor'}
                  aria-label={c ?? 'Sem cor'}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, marginTop: 4 }}>
            <button type="button" className="btn ghost" onClick={close}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Salvando…' : card ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
