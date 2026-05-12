'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import { ENSINO_TIPOS, ENSINO_TIPO_KIND } from '@/types'
import type { Ensino, EnsinoTipo } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const TIPO_COLORS: Record<string, string> = {
  info:    'var(--accent)',
  warning: '#d97706',
  success: '#16a34a',
}

/* -------- Confirm Modal -------- */
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }, [onCancel])
  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  if (!mounted) return null
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'modal-bg-in 0.15s ease both' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, width: '100%', maxWidth: 380, padding: 24, boxShadow: '0 24px 48px rgba(0,0,0,0.18)', animation: 'modal-panel-in 0.2s cubic-bezier(.34,1.56,.64,1) both' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--danger) 12%, transparent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 3v5M8 11h.01" /><circle cx="8" cy="8" r="6" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Confirmar exclusão</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{message}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn ghost sm" onClick={onCancel}>Cancelar</button>
          <button className="btn sm" style={{ background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }} onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* -------- Form -------- */
interface FormState {
  title: string
  tipo: EnsinoTipo
  objetivo: string
  fonte: string
  link: string
  data_publicacao: string
}

const EMPTY: FormState = { title: '', tipo: 'Instrução Normativa', objetivo: '', fonte: '', link: '', data_publicacao: '' }

function EnsinoForm({ initial, onSave, onCancel, saving }: {
  initial?: FormState
  onSave: (f: FormState) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY)
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.link.trim()) return
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-row">
        <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
          <label>Título *</label>
          <input value={form.title} onChange={set('title')} placeholder="Ex: IN nº 3/2024 — Gestão de Recursos" />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Tipo *</label>
          <select value={form.tipo} onChange={set('tipo')}>
            {ENSINO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Fonte</label>
          <input value={form.fonte} onChange={set('fonte')} placeholder="Ex: Tesouro Nacional, DOU…" />
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Data de publicação</label>
          <input type="date" value={form.data_publicacao} onChange={set('data_publicacao')} />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Link *</label>
        <input value={form.link} onChange={set('link')} placeholder="https://…" type="url" />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Objetivo</label>
        <textarea value={form.objetivo} onChange={set('objetivo')} style={{ minHeight: 72 }}
          placeholder="Descreva brevemente o que este documento aborda…" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

/* -------- Card -------- */
function EnsinoCard({ item, canManage, onEdit, onDelete }: {
  item: Ensino
  canManage: boolean
  onEdit: (item: Ensino) => void
  onDelete: (id: string) => void
}) {
  const color = TIPO_COLORS[ENSINO_TIPO_KIND[item.tipo as keyof typeof ENSINO_TIPO_KIND]] ?? 'var(--muted)'

  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Meta: tipo + fonte + data */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 600,
          color, background: `${color}18`, border: `1px solid ${color}40`,
          borderRadius: 3, padding: '2px 7px', whiteSpace: 'nowrap',
        }}>
          {item.tipo}
        </span>
        {item.fonte && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {item.fonte}
          </span>
        )}
        {item.data_publicacao && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }} suppressHydrationWarning>
            · {formatDate(item.data_publicacao)}
          </span>
        )}
      </div>

      {/* Título */}
      <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.45, color: 'var(--ink)' }}>
        {item.title}
      </div>

      {/* Objetivo */}
      {item.objetivo && (
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{item.objetivo}</div>
      )}

      {/* Rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }} suppressHydrationWarning>
          {item.author?.full_name ?? '—'} · {formatDate(item.created_at)}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {canManage && (
            <>
              <button className="btn ghost sm" onClick={() => onEdit(item)}>Editar</button>
              <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(item.id)}>Excluir</button>
            </>
          )}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn primary sm"
            style={{ textDecoration: 'none' }}
          >
            Acessar ↗
          </a>
        </div>
      </div>
    </div>
  )
}

/* -------- Main -------- */
export default function EnsinoClient({ items, canManage }: { items: Ensino[]; canManage: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useUser()

  const [localItems, setLocalItems] = useState<Ensino[]>(items)
  const serverItems = useRef(items)

  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<EnsinoTipo | 'Todos'>('Todos')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Ensino | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return localItems.filter(i => {
      const matchTipo = filterTipo === 'Todos' || i.tipo === filterTipo
      const q = search.toLowerCase()
      const matchSearch = !q || i.title.toLowerCase().includes(q) || (i.objetivo ?? '').toLowerCase().includes(q) || (i.fonte ?? '').toLowerCase().includes(q)
      return matchTipo && matchSearch
    })
  }, [items, search, filterTipo])

  async function handleSave(form: FormState) {
    setSaveError('')
    const now = new Date().toISOString()
    const payload = {
      title: form.title.trim(),
      tipo: form.tipo,
      objetivo: form.objetivo.trim() || null,
      fonte: form.fonte.trim() || null,
      link: form.link.trim(),
      data_publicacao: form.data_publicacao || null,
      updated_at: now,
    }

    if (editing) {
      // Optimistic update
      setLocalItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...payload } : i))
      setShowForm(false)
      setEditing(null)

      const { error } = await supabase.from('ensino').update(payload).eq('id', editing.id)
      if (error) {
        setLocalItems(serverItems.current)
        setSaveError('Erro ao salvar. Tente novamente.')
      } else {
        router.refresh()
      }
    } else {
      const tempId = `temp-${Date.now()}`
      const tempItem: Ensino = {
        id: tempId,
        ...payload,
        objetivo: payload.objetivo,
        fonte: payload.fonte,
        data_publicacao: payload.data_publicacao,
        author_id: user!.id,
        created_at: now,
        updated_at: now,
        author: { id: user!.id, full_name: profile?.full_name ?? '', cargo: profile?.cargo ?? null, role: profile?.role ?? 'servidor', created_at: now, updated_at: now },
      }

      // Optimistic insert
      setLocalItems(prev => [tempItem, ...prev])
      setShowForm(false)

      const { error } = await supabase.from('ensino').insert({ ...payload, author_id: user!.id })
      if (error) {
        setLocalItems(serverItems.current)
        setSaveError('Erro ao salvar. Tente novamente.')
        setShowForm(true)
      } else {
        router.refresh()
      }
    }
  }

  async function handleDelete(id: string) {
    setConfirmId(null)
    setDeleteError('')
    const prev = localItems
    setLocalItems(cur => cur.filter(i => i.id !== id))

    const { error } = await supabase.from('ensino').delete().eq('id', id)
    if (error) {
      setLocalItems(prev)
      setDeleteError('Não foi possível excluir. Verifique sua permissão e tente novamente.')
      setTimeout(() => setDeleteError(''), 4000)
      return
    }
    router.refresh()
  }

  function startEdit(item: Ensino) {
    setEditing(item)
    setShowForm(true)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ensino</h1>
          <p className="sub">Leis, Decretos, Instruções Normativas e demais referências</p>
        </div>
        {canManage && !showForm && (
          <button className="btn primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            + Adicionar
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            {editing ? 'Editar referência' : 'Nova referência'}
          </h3>
          <EnsinoForm
            initial={editing ? {
              title: editing.title,
              tipo: editing.tipo,
              objetivo: editing.objetivo ?? '',
              fonte: editing.fonte ?? '',
              link: editing.link,
              data_publicacao: editing.data_publicacao ?? '',
            } : undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); setSaveError('') }}
            saving={false}
          />
          {saveError && (
            <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{saveError}</p>
          )}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, fonte ou objetivo…"
          />
        </div>
        <div className="form-group" style={{ width: 200, marginBottom: 0 }}>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as EnsinoTipo | 'Todos')}>
            <option value="Todos">Todos os tipos</option>
            {ENSINO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {confirmId && (
        <ConfirmModal
          message="Esta ação não pode ser desfeita."
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {deleteError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', marginBottom: 12,
          background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
          borderRadius: 6, fontSize: 13, color: 'var(--danger)',
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11h.01"/>
          </svg>
          {deleteError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty">
          <p>{items.length === 0 ? 'Nenhuma referência cadastrada ainda.' : 'Nenhum resultado para os filtros aplicados.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(item => (
            <EnsinoCard
              key={item.id}
              item={item}
              canManage={canManage}
              onEdit={startEdit}
              onDelete={(id) => setConfirmId(id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
