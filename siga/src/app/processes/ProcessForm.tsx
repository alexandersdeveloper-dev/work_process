'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Process, ProcessStatus, Priority } from '@/types'

const LS_TYPES_KEY = 'siga_process_types'

const DEFAULT_TYPES = [
  'Atualização de Portal',
  'Solicitação a Fornecedor',
  'Microserviço',
  'Verificação Interna',
  'Correção de Bug',
  'Melhoria',
]

// Converte valores legados (enum keys) para labels legíveis
const LEGACY_MAP: Record<string, string> = {
  portal_update: 'Atualização de Portal',
  supplier_request: 'Solicitação a Fornecedor',
  microservice: 'Microserviço',
  internal_check: 'Verificação Interna',
  bug_fix: 'Correção de Bug',
  improvement: 'Melhoria',
}

function resolveType(raw: string): string {
  return LEGACY_MAP[raw] ?? raw
}

function loadTypes(): string[] {
  if (typeof window === 'undefined') return DEFAULT_TYPES
  try {
    const s = localStorage.getItem(LS_TYPES_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return DEFAULT_TYPES
}

function saveTypes(types: string[]) {
  localStorage.setItem(LS_TYPES_KEY, JSON.stringify(types))
}

const STATUSES: { value: ProcessStatus; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'delayed', label: 'Atrasado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

interface Props { process?: Process }

export default function ProcessForm({ process }: Props) {
  const router = useRouter()
  const isEdit = !!process

  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES)
  const [addingType, setAddingType] = useState(false)
  const [newType, setNewType] = useState('')
  const newTypeRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(process?.title ?? '')
  const [description, setDescription] = useState(process?.description ?? '')
  const [type, setType] = useState<string>(process?.type ? resolveType(process.type) : DEFAULT_TYPES[0])
  const [status, setStatus] = useState<ProcessStatus>(process?.status ?? 'active')
  const [priority, setPriority] = useState<Priority>(process?.priority ?? 'medium')
  const [responsible, setResponsible] = useState(process?.responsible ?? '')
  const [portalSection, setPortalSection] = useState(process?.portal_section ?? '')
  const [deadline, setDeadline] = useState(process?.deadline ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = loadTypes()
    setTypes(stored)
    // se o processo tem um tipo personalizado (não legado e não na lista), preserva
    if (process?.type) {
      const resolved = resolveType(process.type)
      if (!stored.includes(resolved)) {
        const updated = [...stored, resolved]
        setTypes(updated)
        saveTypes(updated)
      }
    }
  }, [process?.type])

  useEffect(() => {
    if (addingType) newTypeRef.current?.focus()
  }, [addingType])

  function confirmNewType() {
    const trimmed = newType.trim()
    if (!trimmed) { setAddingType(false); setNewType(''); return }
    if (!types.includes(trimmed)) {
      const updated = [...types, trimmed]
      setTypes(updated)
      saveTypes(updated)
    }
    setType(trimmed)
    setAddingType(false)
    setNewType('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !responsible.trim()) {
      setError('Título e responsável são obrigatórios.')
      return
    }
    setLoading(true)
    setError('')

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      status,
      priority,
      responsible: responsible.trim(),
      portal_section: portalSection.trim() || null,
      deadline: deadline || null,
      updated_at: new Date().toISOString(),
    }

    let result
    if (isEdit) {
      result = await supabase.from('processes').update(payload).eq('id', process.id)
    } else {
      result = await supabase.from('processes').insert(payload).select().single()
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    const id = isEdit ? process.id : (result.data as Process).id
    router.push(`/processes/${id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Título *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Atualizar banner da homepage" />
      </div>

      <div className="form-group">
        <label>Descrição</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o objetivo e contexto deste processo…" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tipo *</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {addingType ? (
              <>
                <input
                  ref={newTypeRef}
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); confirmNewType() }
                    if (e.key === 'Escape') { setAddingType(false); setNewType('') }
                  }}
                  placeholder="Nome do novo tipo…"
                  style={{ paddingRight: 72 }}
                />
                <div style={{ position: 'absolute', right: 6, display: 'flex', gap: 4 }}>
                  <button type="button" onClick={confirmNewType}
                    style={{ fontSize: 11, padding: '2px 8px', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 2, cursor: 'pointer' }}>
                    OK
                  </button>
                  <button type="button" onClick={() => { setAddingType(false); setNewType('') }}
                    style={{ fontSize: 11, padding: '2px 6px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <select value={type} onChange={(e) => setType(e.target.value)} style={{ paddingRight: 36 }}>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingType(true)}
                  title="Adicionar novo tipo"
                  style={{
                    position: 'absolute', right: 8,
                    width: 20, height: 20,
                    background: 'var(--panel-alt)', border: '1px solid var(--line)',
                    borderRadius: 2, display: 'grid', placeItems: 'center',
                    fontSize: 14, lineHeight: 1, color: 'var(--muted)',
                    cursor: 'pointer', fontWeight: 500,
                  }}>
                  +
                </button>
              </>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Prioridade</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ProcessStatus)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Prazo</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Responsável *</label>
          <input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Nome do responsável" />
        </div>
        <div className="form-group">
          <label>Seção do portal</label>
          <input value={portalSection} onChange={(e) => setPortalSection(e.target.value)} placeholder="Ex: Homepage, Notícias…" />
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar processo'}
        </button>
        <button type="button" className="btn ghost" onClick={() => router.back()}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
