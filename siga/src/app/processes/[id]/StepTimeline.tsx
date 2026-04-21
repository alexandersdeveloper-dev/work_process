'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Step } from '@/types'
import DateTimePicker from '@/components/DateTimePicker'

const LS_KEY = 'siga_step_types'

function loadTypes(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return ['Nota', 'Atualização', 'Solicitação enviada', 'Resposta recebida', 'Publicação feita', 'Verificação', 'Bug reportado', 'Bug corrigido']
}

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

function toNowLocal() {
  const d = new Date()
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

function StepItem({ step, isLast, onSaved }: { step: Step; isLast: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [types, setTypes] = useState<string[]>([])
  const [addingType, setAddingType] = useState(false)
  const [newType, setNewType] = useState('')
  const newTypeRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<EditState>({
    title: step.title,
    description: step.description ?? '',
    stepType: step.step_type ?? 'Nota',
    performedBy: step.performed_by ?? '',
    referenceLink: step.reference_link ?? '',
    datetime: toLocalDatetimeValue(step.created_at),
  })

  useEffect(() => { setTypes(loadTypes()) }, [])
  useEffect(() => { if (addingType) newTypeRef.current?.focus() }, [addingType])

  function confirmNewType() {
    const trimmed = newType.trim()
    if (trimmed && !types.includes(trimmed)) {
      const updated = [...types, trimmed]
      setTypes(updated)
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
    }
    if (trimmed) setForm((f) => ({ ...f, stepType: trimmed }))
    setAddingType(false)
    setNewType('')
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
              <label>Tipo</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {addingType ? (
                  <>
                    <input ref={newTypeRef} value={newType} onChange={(e) => setNewType(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmNewType() } if (e.key === 'Escape') { setAddingType(false); setNewType('') } }}
                      placeholder="Novo tipo…" style={{ paddingRight: 64 }} />
                    <div style={{ position: 'absolute', right: 6, display: 'flex', gap: 4 }}>
                      <button type="button" onClick={confirmNewType}
                        style={{ fontSize: 11, padding: '2px 8px', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 2, cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => { setAddingType(false); setNewType('') }}
                        style={{ fontSize: 11, padding: '2px 6px', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer' }}>✕</button>
                    </div>
                  </>
                ) : (
                  <>
                    <select value={form.stepType} onChange={(e) => setForm((f) => ({ ...f, stepType: e.target.value }))} style={{ paddingRight: 36 }}>
                      {types.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button type="button" onClick={() => setAddingType(true)}
                      style={{ position: 'absolute', right: 8, width: 20, height: 20, background: 'var(--panel-alt)', border: '1px solid var(--line)', borderRadius: 2, display: 'grid', placeItems: 'center', fontSize: 14, color: 'var(--muted)', cursor: 'pointer', fontWeight: 500 }}>+</button>
                  </>
                )}
              </div>
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
    <div className="tl-item" style={{ position: 'relative' }}>
      <div className={`tl-mark${isLast ? ' accent' : ' done'}`}>
        {isLast ? '●' : '✓'}
      </div>
      <div className="tl-body" style={{ flex: 1 }}>
        <div className="tl-t" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {step.title}
          {step.step_type && (
            <span className="tl-type">{step.step_type}</span>
          )}
          {isEdited && (
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
              background: 'var(--panel-alt)', border: '1px solid var(--line)',
              padding: '1px 6px', borderRadius: 2,
            }}>
              editado
            </span>
          )}
        </div>
        {step.description && <div className="tl-d">{step.description}</div>}
        {step.reference_link && <div className="tl-link">{step.reference_link}</div>}
        <div className="tl-m">
          {step.performed_by ? `${step.performed_by} · ` : ''}
          {formatDateTime(step.created_at)}
          {isEdited && step.updated_at && (
            <span style={{ marginLeft: 8, color: 'var(--muted-2)' }}>
              · editado {formatDateTime(step.updated_at)}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{
          position: 'absolute', top: 0, right: 0,
          fontSize: 11, color: 'var(--muted)', background: 'none',
          border: 'none', cursor: 'pointer', padding: '2px 6px',
          opacity: 0.6,
        }}
        title="Editar etapa"
      >
        editar
      </button>
    </div>
  )
}

export default function StepTimeline({ steps }: { steps: Step[] }) {
  const router = useRouter()

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
          onSaved={() => router.refresh()}
        />
      ))}
    </div>
  )
}
