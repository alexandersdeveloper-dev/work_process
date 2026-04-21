'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DateTimePicker from '@/components/DateTimePicker'

const DEFAULT_TYPES = [
  'Nota',
  'Atualização',
  'Solicitação enviada',
  'Resposta recebida',
  'Publicação feita',
  'Verificação',
  'Bug reportado',
  'Bug corrigido',
]

const LS_KEY = 'siga_step_types'

function loadTypes(): string[] {
  if (typeof window === 'undefined') return DEFAULT_TYPES
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_TYPES
}

function saveTypes(types: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(types))
}


export default function AddStepForm({ processId }: { processId: string }) {
  const router = useRouter()
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES)
  const [stepType, setStepType] = useState('Nota')
  const [adding, setAdding] = useState(false)
  const [newType, setNewType] = useState('')
  const newTypeInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [referenceLink, setReferenceLink] = useState('')
  const [datetime, setDatetime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setTypes(loadTypes())
  }, [])

  useEffect(() => {
    if (adding) newTypeInputRef.current?.focus()
  }, [adding])

  function confirmNewType() {
    const trimmed = newType.trim()
    if (!trimmed) { setAdding(false); setNewType(''); return }
    if (!types.includes(trimmed)) {
      const updated = [...types, trimmed]
      setTypes(updated)
      saveTypes(updated)
    }
    setStepType(trimmed)
    setAdding(false)
    setNewType('')
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) { setError('Título é obrigatório.'); return }
    setLoading(true)
    setError('')

    const createdAt = datetime
      ? new Date(datetime).toISOString()
      : new Date().toISOString()

    const { error: err } = await supabase.from('steps').insert({
      process_id: processId,
      title: title.trim(),
      description: description.trim() || null,
      step_type: stepType,
      performed_by: performedBy.trim() || null,
      reference_link: referenceLink.trim() || null,
      created_at: createdAt,
    })

    if (err) { setError(err.message); setLoading(false); return }

    // best-effort: ignore error — step is already saved
    await supabase
      .from('processes')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', processId)

    setTitle('')
    setDescription('')
    setStepType('Nota')
    setPerformedBy('')
    setReferenceLink('')
    setDatetime('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>O que foi feito *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Enviado e-mail para o fornecedor solicitando acesso"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Tipo de etapa</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            {adding ? (
              <>
                <input
                  ref={newTypeInputRef}
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); confirmNewType() }
                    if (e.key === 'Escape') { setAdding(false); setNewType('') }
                  }}
                  placeholder="Nome do novo tipo…"
                  style={{ paddingRight: 64 }}
                />
                <div style={{ position: 'absolute', right: 6, display: 'flex', gap: 4 }}>
                  <button type="button" onClick={confirmNewType}
                    style={{ fontSize: 11, padding: '2px 8px', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 2, cursor: 'pointer' }}>
                    OK
                  </button>
                  <button type="button" onClick={() => { setAdding(false); setNewType('') }}
                    style={{ fontSize: 11, padding: '2px 6px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <select value={stepType} onChange={(e) => setStepType(e.target.value)}>
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" onClick={() => setAdding(true)} title="Adicionar novo tipo"
                  style={{ flexShrink: 0, width: 28, height: 28, background: 'var(--panel-alt)', border: '1px solid var(--line)', borderRadius: 4, display: 'grid', placeItems: 'center', fontSize: 16, lineHeight: 1, color: 'var(--muted)', cursor: 'pointer', fontWeight: 500 }}>
                  +
                </button>
              </>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Feito por</label>
          <input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Nome (opcional)" />
        </div>
      </div>

      <div className="form-group">
        <label>
          Data e hora
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: 'var(--muted-2)', fontSize: 11 }}>
            (vazio = agora)
          </span>
        </label>
        <DateTimePicker value={datetime} onChange={setDatetime} maxNow />
      </div>

      <div className="form-group">
        <label>Detalhes</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes adicionais sobre esta etapa…"
          style={{ minHeight: 70 }}
        />
      </div>

      <div className="form-group">
        <label>Link de referência</label>
        <input
          value={referenceLink}
          onChange={(e) => setReferenceLink(e.target.value)}
          placeholder="https://… (ticket, PR, e-mail, doc…)"
        />
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</p>}

      <button type="submit" className="btn primary" disabled={loading}>
        {loading ? 'Registrando…' : '+ Registrar etapa'}
      </button>
    </form>
  )
}
