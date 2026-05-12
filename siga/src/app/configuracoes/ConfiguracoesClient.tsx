'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'

const PROCESS_TYPE_LIMIT = 15
const STEP_TYPE_LIMIT = 15

const DEFAULT_PROCESS_TYPES = [
  'Solicitação',
  'Verificação Interna',
  'Correção',
  'Publicação',
  'Melhoria',
]

const DEFAULT_STEP_TYPES = [
  'Nota',
  'Solicitação enviada',
  'Resposta recebida',
  'Verificação',
  'Concluído',
]

type Tab = 'processos' | 'etapas'

interface TypeRow {
  id: string
  label: string
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ConfiguracoesClient() {
  const { user, loading: userLoading } = useUser()
  const [tab, setTab] = useState<Tab>('processos')
  const [processTypes, setProcessTypes] = useState<TypeRow[]>([])
  const [stepTypes, setStepTypes] = useState<TypeRow[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const newLabelRef = useRef<HTMLInputElement>(null)

  const currentTypes = tab === 'processos' ? processTypes : stepTypes
  const setCurrentTypes = tab === 'processos' ? setProcessTypes : setStepTypes
  const defaults = tab === 'processos' ? DEFAULT_PROCESS_TYPES : DEFAULT_STEP_TYPES
  const limit = tab === 'processos' ? PROCESS_TYPE_LIMIT : STEP_TYPE_LIMIT
  const table = tab === 'processos' ? 'user_process_types' : 'user_step_types'
  const used = defaults.length + currentTypes.length
  const remaining = limit - currentTypes.length
  const atLimit = currentTypes.length >= limit

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoadingTypes(true)
      const [{ data: pt }, { data: st }] = await Promise.all([
        supabase.from('user_process_types').select('id, label, created_at').eq('user_id', user!.id).order('created_at'),
        supabase.from('user_step_types').select('id, label, created_at').eq('user_id', user!.id).order('created_at'),
      ])
      setProcessTypes(pt ?? [])
      setStepTypes(st ?? [])
      setLoadingTypes(false)
    }
    load()
  }, [user])

  useEffect(() => {
    if (adding) newLabelRef.current?.focus()
  }, [adding, tab])

  function resetActions() {
    setEditingId(null)
    setEditLabel('')
    setDeletingId(null)
    setAdding(false)
    setNewLabel('')
    setError('')
  }

  async function handleAdd() {
    const trimmed = newLabel.trim()
    if (!trimmed || !user) return
    if (atLimit) { setError(`Limite de ${limit} tipos personalizados atingido.`); return }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase
      .from(table)
      .insert({ user_id: user.id, label: trimmed })
      .select('id, created_at')
      .single()
    setSaving(false)
    if (err) { setError('Erro ao adicionar tipo.'); return }
    setCurrentTypes((prev) => [...prev, { id: data.id, label: trimmed, created_at: data.created_at }])
    setNewLabel('')
    setAdding(false)
  }

  async function handleRename(row: TypeRow) {
    const trimmed = editLabel.trim()
    if (!trimmed || trimmed === row.label || !user) { resetActions(); return }
    setSaving(true)
    setError('')

    const { error: err } = await supabase.from(table).update({ label: trimmed }).eq('id', row.id)
    if (err) { setSaving(false); setError('Erro ao salvar.'); return }

    // Cascata: atualiza registros existentes com o label antigo
    if (tab === 'processos') {
      await supabase.from('processes').update({ type: trimmed }).eq('type', row.label)
    } else {
      const { data: procs } = await supabase.from('processes').select('id').eq('owner_id', user.id)
      if (procs && procs.length > 0) {
        const ids = procs.map((p: { id: string }) => p.id)
        await supabase.from('steps').update({ step_type: trimmed }).eq('step_type', row.label).in('process_id', ids)
      }
    }

    setCurrentTypes((prev) => prev.map((t) => t.id === row.id ? { ...t, label: trimmed } : t))
    setSaving(false)
    setEditingId(null)
    setEditLabel('')
  }

  async function handleDelete(row: TypeRow) {
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from(table).delete().eq('id', row.id)
    setSaving(false)
    if (err) { setError('Erro ao excluir.'); return }
    setCurrentTypes((prev) => prev.filter((t) => t.id !== row.id))
    setDeletingId(null)
  }

  if (userLoading || loadingTypes) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Configurações</h1>
            <p className="sub">Tipos personalizados de processo e etapa</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 44, borderRadius: 4 }} />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Configurações</h1>
          <p className="sub">Tipos personalizados de processo e etapa</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 28 }}>
        <button className={`tab${tab === 'processos' ? ' active' : ''}`}
          onClick={() => { setTab('processos'); resetActions() }}>
          Tipo de Processo
        </button>
        <button className={`tab${tab === 'etapas' ? ' active' : ''}`}
          onClick={() => { setTab('etapas'); resetActions() }}>
          Tipo de Etapa
        </button>
      </div>

      {/* Tipos padrão */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
          Padrão do sistema — não editáveis
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {defaults.map((d) => (
            <span key={d} style={{
              fontSize: 12, fontFamily: 'var(--font-mono)',
              padding: '4px 10px', borderRadius: 2,
              background: 'var(--panel-alt)', border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}>
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Tipos personalizados */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              Seus tipos personalizados
            </span>
            <span style={{
              marginLeft: 10, fontSize: 11, fontFamily: 'var(--font-mono)',
              color: atLimit ? 'var(--danger)' : 'var(--muted-2)',
            }}>
              {currentTypes.length}/{limit}
              {!atLimit && <span style={{ color: 'var(--muted-2)' }}> · {remaining} restante{remaining !== 1 ? 's' : ''}</span>}
            </span>
          </div>
          {!adding && (
            <button
              className="btn ghost sm"
              onClick={() => { setAdding(true); setEditingId(null); setDeletingId(null); setError('') }}
              disabled={atLimit}
              title={atLimit ? `Limite de ${limit} tipos atingido` : undefined}
            >
              + Adicionar
            </button>
          )}
        </div>

        {/* Formulário de adição */}
        {adding && (
          <div className="card" style={{ padding: '14px 16px', marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label>Nome do tipo</label>
              <input
                ref={newLabelRef}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                  if (e.key === 'Escape') { setAdding(false); setNewLabel(''); setError('') }
                }}
                placeholder={tab === 'processos' ? 'Ex: Licitação, Contrato…' : 'Ex: Aprovação, Homologação…'}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary sm" onClick={handleAdd} disabled={saving || !newLabel.trim()}>
                {saving ? 'Salvando…' : 'Adicionar'}
              </button>
              <button className="btn ghost sm" onClick={() => { setAdding(false); setNewLabel(''); setError('') }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</p>}

        {currentTypes.length === 0 && !adding ? (
          <div style={{
            padding: '20px 16px', borderRadius: 4,
            border: '1px dashed var(--line)',
            color: 'var(--muted)', fontSize: 13, textAlign: 'center',
          }}>
            Nenhum tipo personalizado ainda. Clique em "+ Adicionar" para criar.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="t" style={{ width: '100%' }}>
              <tbody>
                {currentTypes.map((row) => {
                  const isEditing = editingId === row.id
                  const isDeleting = deletingId === row.id

                  return (
                    <tr key={row.id}>
                      <td>
                        {isEditing ? (
                          <input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleRename(row) }
                              if (e.key === 'Escape') { setEditingId(null); setEditLabel(''); setError('') }
                            }}
                            style={{ width: '100%', maxWidth: 320 }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.label}</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--muted-2)', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        {formatDate(row.created_at)}
                      </td>
                      <td style={{ width: 200 }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn primary sm" onClick={() => handleRename(row)} disabled={saving}>
                              {saving ? '…' : 'Salvar'}
                            </button>
                            <button className="btn ghost sm" onClick={() => { setEditingId(null); setEditLabel(''); setError('') }}>
                              Cancelar
                            </button>
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
                              onClick={() => { setEditingId(row.id); setEditLabel(row.label); setDeletingId(null); setError('') }}
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
      </div>

      {/* Info sobre renomeação */}
      {currentTypes.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted-2)' }}>
          Ao renomear um tipo, todos os processos e etapas que o utilizam serão atualizados automaticamente.
        </p>
      )}
    </>
  )
}
