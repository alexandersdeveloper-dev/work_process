'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import type { Process, ProcessStatus, Priority } from '@/types'

const PROCESS_TYPE_LIMIT = 15

const DEFAULT_TYPES = [
  'Atualização de Portal',
  'Solicitação a Fornecedor',
  'Microserviço',
  'Verificação Interna',
  'Correção de Bug',
  'Melhoria',
]

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
  const { user } = useUser()
  const isEdit = !!process

  const [customTypes, setCustomTypes] = useState<string[]>([])
  const [addingType, setAddingType]   = useState(false)
  const [newType, setNewType]         = useState('')
  const [typeError, setTypeError]     = useState('')
  const newTypeRef = useRef<HTMLInputElement>(null)

  const [title, setTitle]               = useState(process?.title ?? '')
  const [description, setDescription]   = useState(process?.description ?? '')
  const [type, setType]                 = useState<string>(process?.type ? resolveType(process.type) : DEFAULT_TYPES[0])
  const [status, setStatus]             = useState<ProcessStatus>(process?.status ?? 'active')
  const [priority, setPriority]         = useState<Priority>(process?.priority ?? 'medium')
  const [responsible, setResponsible]   = useState(process?.responsible ?? '')
  const [portalSection, setPortalSection] = useState(process?.portal_section ?? '')
  const [deadline, setDeadline]         = useState(process?.deadline ?? '')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  // Types: DEFAULT + custom from DB + current process type (se não estiver na lista)
  const resolvedProcessType = process?.type ? resolveType(process.type) : null
  const allTypes = [
    ...DEFAULT_TYPES,
    ...customTypes,
    ...(resolvedProcessType && !DEFAULT_TYPES.includes(resolvedProcessType) && !customTypes.includes(resolvedProcessType)
      ? [resolvedProcessType]
      : []),
  ]
  const atLimit   = allTypes.length >= PROCESS_TYPE_LIMIT
  const remaining = PROCESS_TYPE_LIMIT - allTypes.length

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('user_process_types')
        .select('label')
        .order('created_at', { ascending: true })
      if (data) setCustomTypes(data.map((r) => r.label))
    }
    load()
  }, [user])

  useEffect(() => {
    if (addingType) newTypeRef.current?.focus()
  }, [addingType])

  async function confirmNewType() {
    const trimmed = newType.trim()
    if (!trimmed) { setAddingType(false); setNewType(''); return }

    if (allTypes.includes(trimmed)) {
      setType(trimmed)
      setAddingType(false)
      setNewType('')
      return
    }

    if (atLimit) {
      setTypeError(`Limite de ${PROCESS_TYPE_LIMIT} tipos atingido.`)
      return
    }

    if (!user) return

    const { error: err } = await supabase
      .from('user_process_types')
      .insert({ user_id: user.id, label: trimmed })

    if (!err) {
      setCustomTypes((prev) => [...prev, trimmed])
      setType(trimmed)
    }
    setAddingType(false)
    setNewType('')
    setTypeError('')
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
      result = await supabase.from('processes').insert({
        ...payload,
        owner_id: user?.id ?? null,
      }).select().single()
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <label style={{ margin: 0 }}>Tipo *</label>
            <span style={{ fontSize: 11, color: atLimit ? 'var(--danger)' : 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>
              {allTypes.length}/{PROCESS_TYPE_LIMIT}
            </span>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            {addingType ? (
              <>
                <input
                  ref={newTypeRef}
                  value={newType}
                  onChange={(e) => { setNewType(e.target.value); setTypeError('') }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); confirmNewType() }
                    if (e.key === 'Escape') { setAddingType(false); setNewType(''); setTypeError('') }
                  }}
                  placeholder="Nome do novo tipo…"
                  style={{ paddingRight: 72 }}
                />
                <div style={{ position: 'absolute', right: 6, display: 'flex', gap: 4 }}>
                  <button type="button" onClick={confirmNewType}
                    style={{ fontSize: 11, padding: '2px 8px', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 2, cursor: 'pointer' }}>
                    OK
                  </button>
                  <button type="button" onClick={() => { setAddingType(false); setNewType(''); setTypeError('') }}
                    style={{ fontSize: 11, padding: '2px 6px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => { if (!atLimit) setAddingType(true) }}
                  disabled={atLimit}
                  title={atLimit ? `Limite de ${PROCESS_TYPE_LIMIT} tipos atingido` : `Adicionar novo tipo (${remaining} restante${remaining !== 1 ? 's' : ''})`}
                  style={{
                    flexShrink: 0, width: 28, height: 28,
                    background: atLimit ? 'var(--line)' : 'var(--panel-alt)',
                    border: '1px solid var(--line)', borderRadius: 4,
                    display: 'grid', placeItems: 'center',
                    fontSize: 16, lineHeight: 1,
                    color: atLimit ? 'var(--muted-2)' : 'var(--muted)',
                    cursor: atLimit ? 'not-allowed' : 'pointer', fontWeight: 500,
                  }}>
                  +
                </button>
              </>
            )}
          </div>
          {typeError && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{typeError}</p>}
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
