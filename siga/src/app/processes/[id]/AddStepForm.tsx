'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import DateTimePicker from '@/components/DateTimePicker'

const STEP_TYPE_LIMIT = 15

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

export default function AddStepForm({ processId, onSuccess }: { processId: string; onSuccess?: () => void }) {
  const router = useRouter()
  const { user } = useUser()

  const [customTypes, setCustomTypes] = useState<string[]>([])
  const [stepType, setStepType]       = useState('Nota')
  const [adding, setAdding]           = useState(false)
  const [newType, setNewType]         = useState('')
  const [typeError, setTypeError]     = useState('')
  const newTypeInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [performedBy, setPerformedBy]   = useState('')
  const [referenceLink, setReferenceLink] = useState('')
  const [datetime, setDatetime]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const allTypes = [...DEFAULT_TYPES, ...customTypes]
  const atLimit  = allTypes.length >= STEP_TYPE_LIMIT
  const remaining = STEP_TYPE_LIMIT - allTypes.length

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('user_step_types')
        .select('label')
        .order('created_at', { ascending: true })
      if (data) setCustomTypes(data.map((r) => r.label))
    }
    load()
  }, [user])

  useEffect(() => {
    if (adding) newTypeInputRef.current?.focus()
  }, [adding])

  async function confirmNewType() {
    const trimmed = newType.trim()
    if (!trimmed) { setAdding(false); setNewType(''); return }

    if (allTypes.includes(trimmed)) {
      setStepType(trimmed)
      setAdding(false)
      setNewType('')
      return
    }

    if (atLimit) {
      setTypeError(`Limite de ${STEP_TYPE_LIMIT} tipos atingido.`)
      return
    }

    if (!user) return

    const { error: err } = await supabase
      .from('user_step_types')
      .insert({ user_id: user.id, label: trimmed })

    if (!err) {
      setCustomTypes((prev) => [...prev, trimmed])
      setStepType(trimmed)
    }
    setAdding(false)
    setNewType('')
    setTypeError('')
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
    onSuccess?.()
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <label style={{ margin: 0 }}>Tipo de etapa</label>
            <span style={{ fontSize: 11, color: atLimit ? 'var(--danger)' : 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>
              {allTypes.length}/{STEP_TYPE_LIMIT}
            </span>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            {adding ? (
              <>
                <input
                  ref={newTypeInputRef}
                  value={newType}
                  onChange={(e) => { setNewType(e.target.value); setTypeError('') }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); confirmNewType() }
                    if (e.key === 'Escape') { setAdding(false); setNewType(''); setTypeError('') }
                  }}
                  placeholder="Nome do novo tipo…"
                  style={{ paddingRight: 64 }}
                />
                <div style={{ position: 'absolute', right: 6, display: 'flex', gap: 4 }}>
                  <button type="button" onClick={confirmNewType}
                    style={{ fontSize: 11, padding: '2px 8px', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 2, cursor: 'pointer' }}>
                    OK
                  </button>
                  <button type="button" onClick={() => { setAdding(false); setNewType(''); setTypeError('') }}
                    style={{ fontSize: 11, padding: '2px 6px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </>
            ) : (
              <>
                <select value={stepType} onChange={(e) => setStepType(e.target.value)}>
                  {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => { if (!atLimit) setAdding(true) }}
                  disabled={atLimit}
                  title={atLimit ? `Limite de ${STEP_TYPE_LIMIT} tipos atingido` : `Adicionar novo tipo (${remaining} restante${remaining !== 1 ? 's' : ''})`}
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
          {typeError && (
            <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{typeError}</p>
          )}
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
