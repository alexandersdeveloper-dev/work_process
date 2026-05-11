'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
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
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                · {formatDate(item.data_publicacao)}
              </span>
            )}
          </div>
          <div style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.4, marginBottom: item.objetivo ? 6 : 0 }}>
            {item.title}
          </div>
          {item.objetivo && (
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{item.objetivo}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn primary sm"
            style={{ textDecoration: 'none' }}
          >
            Acessar ↗
          </a>
          {canManage && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn ghost sm" onClick={() => onEdit(item)}>Editar</button>
              <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(item.id)}>Excluir</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 2 }}>
        Adicionado por {item.author?.full_name ?? '—'} · {formatDate(item.created_at)}
      </div>
    </div>
  )
}

/* -------- Main -------- */
export default function EnsinoClient({ items, canManage }: { items: Ensino[]; canManage: boolean }) {
  const router = useRouter()
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<EnsinoTipo | 'Todos'>('Todos')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Ensino | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchTipo = filterTipo === 'Todos' || i.tipo === filterTipo
      const q = search.toLowerCase()
      const matchSearch = !q || i.title.toLowerCase().includes(q) || (i.objetivo ?? '').toLowerCase().includes(q) || (i.fonte ?? '').toLowerCase().includes(q)
      return matchTipo && matchSearch
    })
  }, [items, search, filterTipo])

  async function handleSave(form: FormState) {
    setSaving(true)
    setSaveError('')
    const payload = {
      title: form.title.trim(),
      tipo: form.tipo,
      objetivo: form.objetivo.trim() || null,
      fonte: form.fonte.trim() || null,
      link: form.link.trim(),
      data_publicacao: form.data_publicacao || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = editing
      ? await supabase.from('ensino').update(payload).eq('id', editing.id)
      : await supabase.from('ensino').insert(payload)

    setSaving(false)
    if (error) {
      setSaveError('Erro ao salvar. Tente novamente.')
      return
    }
    setShowForm(false)
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este item?')) return
    setDeleteError('')
    const { error } = await supabase.from('ensino').delete().eq('id', id)
    if (error) {
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
            saving={saving}
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
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </>
  )
}
