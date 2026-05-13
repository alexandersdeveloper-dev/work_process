'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import { useUserTypes } from '@/lib/use-user-types'
import type { Step, StepMarkState } from '@/types'
import StepShareModal from './StepShareModal'
import DateTimePicker from '@/components/DateTimePicker'

const STEP_TYPE_LIMIT = 15

const DEFAULT_STEP_TYPES = [
  'Nota',
  'Solicitação enviada',
  'Resposta recebida',
  'Verificação',
  'Concluído',
]

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EditState {
  title: string
  description: string
  stepType: string
  performedBy: string
  referenceLink: string
  datetime: string
}

const MARK_CYCLE: StepMarkState[] = ['neutral', 'positive', 'negative']

interface StepItemProps {
  step: Step
  isLast: boolean
  onSaved: () => void
  processId: string
  canShare: boolean
  allTypes: string[]
  atLimit: boolean
  userId: string
  onTypeAdded: (label: string) => void
}

const StepItem = memo(function StepItem({ step, isLast, onSaved, processId, canShare, allTypes, atLimit, userId, onTypeAdded }: StepItemProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [markState, setMarkState] = useState<StepMarkState>(step.mark_state ?? 'neutral')
  const [addingType, setAddingType] = useState(false)
  const [newType, setNewType] = useState('')
  const [typeError, setTypeError] = useState('')
  const newTypeRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<EditState>({
    title: step.title,
    description: step.description ?? '',
    stepType: step.step_type ?? 'Nota',
    performedBy: step.performed_by ?? '',
    referenceLink: step.reference_link ?? '',
    datetime: toLocalDatetimeValue(step.created_at),
  })

  useEffect(() => { if (addingType) newTypeRef.current?.focus() }, [addingType])

  async function handleMarkClick() {
    const next = MARK_CYCLE[(MARK_CYCLE.indexOf(markState) + 1) % MARK_CYCLE.length]
    setMarkState(next)
    await supabase.from('steps').update({ mark_state: next }).eq('id', step.id)
  }

  async function confirmNewType() {
    const trimmed = newType.trim()
    if (!trimmed) { setAddingType(false); setNewType(''); return }

    if (allTypes.includes(trimmed)) {
      setForm((f) => ({ ...f, stepType: trimmed }))
      setAddingType(false)
      setNewType('')
      return
    }

    if (atLimit) {
      setTypeError(`Limite de ${STEP_TYPE_LIMIT} tipos atingido.`)
      return
    }

    const { error: err } = await supabase
      .from('user_step_types')
      .insert({ user_id: userId, label: trimmed })

    if (!err) {
      onTypeAdded(trimmed)
      setForm((f) => ({ ...f, stepType: trimmed }))
    }
    setAddingType(false)
    setNewType('')
    setTypeError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('steps').update({
      title: form.title.trim(),
      description: form.description.trim() || null,
      step_type: form.stepType,
      performed_by: form.performedBy.trim() || null,
      reference_link: form.referenceLink.trim() || null,
      created_at: new Date(form.datetime).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', step.id)
    setSaving(false)
    setEditing(false)
    onSaved()
  }

  const remaining = STEP_TYPE_LIMIT - allTypes.length
  const isEdited = !!step.updated_at

  if (editing) {
    return (
      <div className="tl-item">
        <div className="tl-mark accent">✎</div>
        <form onSubmit={handleSave} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>O que foi feito *</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <label style={{ margin: 0 }}>Tipo</label>
                <span style={{ fontSize: 11, color: atLimit ? 'var(--danger)' : 'var(--muted-2)', fontFamily: 'var(--font-mono)' }}>
                  {allTypes.length}/{STEP_TYPE_LIMIT}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                      placeholder="Novo tipo…"
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
                    <select value={form.stepType} onChange={(e) => setForm((f) => ({ ...f, stepType: e.target.value }))}>
                      {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { if (!atLimit) setAddingType(true) }}
                      disabled={atLimit}
                      title={atLimit ? `Limite de ${STEP_TYPE_LIMIT} tipos atingido` : `Adicionar novo tipo (${remaining} restante${remaining !== 1 ? 's' : ''})`}
                      style={{
                        flexShrink: 0, width: 24, height: 24,
                        background: atLimit ? 'var(--line)' : 'var(--panel-alt)',
                        border: '1px solid var(--line)', borderRadius: 2,
                        display: 'grid', placeItems: 'center',
                        fontSize: 14, lineHeight: 1,
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Feito por</label>
              <input value={form.performedBy} onChange={(e) => setForm((f) => ({ ...f, performedBy: e.target.value }))} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Data e hora</label>
            <DateTimePicker value={form.datetime} onChange={(iso) => setForm((f) => ({ ...f, datetime: iso }))} maxNow />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Detalhes</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={{ minHeight: 60 }} />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Link</label>
            <input value={form.referenceLink} onChange={(e) => setForm((f) => ({ ...f, referenceLink: e.target.value }))} placeholder="https://…" />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" className="btn primary sm" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="btn ghost sm" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="tl-item">
      <div
        className={`tl-mark clickable${markState === 'positive' ? ' done' : markState === 'negative' ? ' negative' : ' accent'}`}
        onClick={handleMarkClick}
        title={markState === 'neutral' ? 'Marcar como positivo' : markState === 'positive' ? 'Marcar como negativo' : 'Remover marcação'}
      >
        {markState === 'positive' ? '✓' : markState === 'negative' ? '✗' : '●'}
      </div>
      <div className="tl-body" style={{ flex: 1, minWidth: 0 }}>
        {/* Linha de título + ações em fluxo normal — sem position:absolute */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div className="tl-t" style={{ flex: 1, minWidth: 0 }}>
            {step.title}
            {step.step_type && (
              <span className="tl-type">{step.step_type}</span>
            )}
            {isEdited && (
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
                background: 'var(--panel-alt)', border: '1px solid var(--line)',
                padding: '1px 6px', borderRadius: 2, marginLeft: 6,
              }}>
                editado
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {canShare && (
              <StepShareModal stepId={step.id} stepTitle={step.title} processId={processId} />
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                fontSize: 11, color: 'var(--muted)', background: 'none',
                border: 'none', cursor: 'pointer', padding: '2px 6px',
                opacity: 0.6,
              }}
              title="Editar etapa"
            >
              editar
            </button>
          </div>
        </div>
        {step.description && <div className="tl-d">{step.description}</div>}
        {step.reference_link && <div className="tl-link">{step.reference_link}</div>}
        <div className="tl-m" suppressHydrationWarning>
          {step.performed_by ? `${step.performed_by} · ` : ''}
          {formatDateTime(step.created_at)}
          {isEdited && step.updated_at && (
            <span style={{ marginLeft: 8, color: 'var(--muted-2)' }} suppressHydrationWarning>
              · editado {formatDateTime(step.updated_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

export default function StepTimeline({ steps, processId, canShare }: { steps: Step[]; processId: string; canShare: boolean }) {
  const router = useRouter()
  const { user } = useUser()
  const { customTypes, addType } = useUserTypes('user_step_types')

  const allTypes = [...DEFAULT_STEP_TYPES, ...customTypes]
  const atLimit = allTypes.length >= STEP_TYPE_LIMIT

  const handleSaved = useCallback(() => router.refresh(), [router])
  const handleTypeAdded = useCallback((label: string) => addType(label), [addType])

  if (steps.length === 0) {
    return (
      <div className="empty">
        <p>Nenhuma etapa registrada ainda.</p>
      </div>
    )
  }

  return (
    <div className="timeline">
      {steps.map((step, i) => (
        <StepItem
          key={step.id}
          step={step}
          isLast={i === steps.length - 1}
          onSaved={handleSaved}
          processId={processId}
          canShare={canShare}
          allTypes={allTypes}
          atLimit={atLimit}
          userId={user?.id ?? ''}
          onTypeAdded={handleTypeAdded}
        />
      ))}
    </div>
  )
}
