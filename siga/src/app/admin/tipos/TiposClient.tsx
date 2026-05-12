'use client'

import { useState } from 'react'

export interface TypeRow {
  id: string
  user_id: string
  label: string
  created_at: string
  user_name: string
}

interface User {
  id: string
  full_name: string | null
}

interface Props {
  processTypes: TypeRow[]
  stepTypes: TypeRow[]
  users: User[]
}

type Tab = 'processos' | 'etapas'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function TiposClient({ processTypes: initialProcess, stepTypes: initialStep, users }: Props) {
  const [tab, setTab] = useState<Tab>('processos')
  const [processTypes, setProcessTypes] = useState<TypeRow[]>(initialProcess)
  const [stepTypes, setStepTypes] = useState<TypeRow[]>(initialStep)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addUserId, setAddUserId] = useState(users[0]?.id ?? '')
  const [addLabel, setAddLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const currentTypes = tab === 'processos' ? processTypes : stepTypes
  const setCurrentTypes = tab === 'processos' ? setProcessTypes : setStepTypes
  const table = tab === 'processos' ? 'user_process_types' : 'user_step_types'

  function startEdit(row: TypeRow) {
    setEditingId(row.id)
    setEditLabel(row.label)
    setDeletingId(null)
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditLabel('')
    setError('')
  }

  async function handleRename(row: TypeRow) {
    const trimmed = editLabel.trim()
    if (!trimmed || trimmed === row.label) { cancelEdit(); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/types', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id: row.id, label: trimmed, old_label: row.label, user_id: row.user_id }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return }
    setCurrentTypes((prev) => prev.map((t) => t.id === row.id ? { ...t, label: trimmed } : t))
    cancelEdit()
  }

  async function handleDelete(row: TypeRow) {
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/types', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id: row.id, label: row.label, user_id: row.user_id }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Erro ao excluir'); return }
    setCurrentTypes((prev) => prev.filter((t) => t.id !== row.id))
    setDeletingId(null)
  }

  async function handleAdd() {
    const trimmed = addLabel.trim()
    if (!trimmed || !addUserId) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, user_id: addUserId, label: trimmed }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Erro ao criar'); return }
    const userName = users.find((u) => u.id === addUserId)?.full_name ?? 'Desconhecido'
    const newRow: TypeRow = { id: json.id, user_id: addUserId, label: trimmed, created_at: json.created_at, user_name: userName }
    setCurrentTypes((prev) => [...prev, newRow])
    setAddLabel('')
    setAdding(false)
  }

  return (
    <>
      {/* Tabs + Add */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div className="tabs" style={{ margin: 0 }}>
          <button
            className={`tab${tab === 'processos' ? ' active' : ''}`}
            onClick={() => { setTab('processos'); setEditingId(null); setDeletingId(null); setAdding(false); setError('') }}
          >
            Tipo de Processo
            <span style={{ marginLeft: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              {processTypes.length}
            </span>
          </button>
          <button
            className={`tab${tab === 'etapas' ? ' active' : ''}`}
            onClick={() => { setTab('etapas'); setEditingId(null); setDeletingId(null); setAdding(false); setError('') }}
          >
            Tipo de Etapa
            <span style={{ marginLeft: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              {stepTypes.length}
            </span>
          </button>
        </div>

        <button
          className="btn primary sm"
          onClick={() => { setAdding((v) => !v); setError(''); setEditingId(null); setDeletingId(null) }}
        >
          {adding ? 'Cancelar' : '+ Adicionar'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Usuário</label>
            <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} style={{ minWidth: 160 }}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name ?? u.id}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Tipo</label>
            <input
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } if (e.key === 'Escape') setAdding(false) }}
              placeholder={tab === 'processos' ? 'Ex: Licitação, Contrato…' : 'Ex: Aprovação, Publicação…'}
              style={{ flex: 1 }}
              autoFocus
            />
          </div>
          <button className="btn primary sm" onClick={handleAdd} disabled={saving || !addLabel.trim()}>
            {saving ? 'Salvando…' : 'Adicionar'}
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      {/* Table */}
      {currentTypes.length === 0 ? (
        <div className="empty">
          <p>Nenhum tipo personalizado criado ainda.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="t" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Tipo</th>
                <th>Criado em</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {currentTypes.map((row) => {
                const isEditing = editingId === row.id
                const isDeleting = deletingId === row.id

                return (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--ink-2)', fontSize: 13 }}>{row.user_name}</td>

                    <td>
                      {isEditing ? (
                        <input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleRename(row) }
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          style={{ width: '100%', maxWidth: 280 }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.label}</span>
                      )}
                    </td>

                    <td style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {formatDate(row.created_at)}
                    </td>

                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn primary sm" onClick={() => handleRename(row)} disabled={saving}>
                            {saving ? '…' : 'Salvar'}
                          </button>
                          <button className="btn ghost sm" onClick={cancelEdit}>Cancelar</button>
                        </div>
                      ) : isDeleting ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--danger)' }}>Excluir?</span>
                          <button
                            className="btn sm"
                            style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
                            onClick={() => handleDelete(row)}
                            disabled={saving}
                          >
                            {saving ? '…' : 'Sim'}
                          </button>
                          <button className="btn ghost sm" onClick={() => setDeletingId(null)}>Não</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}
                          >
                            editar
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeletingId(row.id); setEditingId(null); setError('') }}
                            style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px', opacity: 0.7 }}
                          >
                            excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
