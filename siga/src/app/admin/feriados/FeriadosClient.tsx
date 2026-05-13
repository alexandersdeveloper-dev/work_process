'use client'

import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { Feriado, FeriadoType, FeriadoScope, FeriadoRecurrence, FeriadoImpact } from '@/types'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const TYPE_LABELS: Record<FeriadoType, string> = {
  feriado: 'Feriado',
  ponto_facultativo: 'Ponto Facultativo',
}
const SCOPE_LABELS: Record<FeriadoScope, string> = {
  nacional: 'Nacional',
  estadual: 'Estadual',
  municipal: 'Municipal',
}
const IMPACT_LABELS: Record<FeriadoImpact, string> = {
  visualizacao: 'Visualização',
  alerta: 'Alerta',
  bloqueio: 'Bloqueio',
}

const IMPACT_COLORS: Record<FeriadoImpact, { bg: string; color: string; border: string }> = {
  visualizacao: { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', border: 'rgba(59,130,246,0.3)' },
  alerta: { bg: 'rgba(217,119,6,0.1)', color: '#92400e', border: 'rgba(217,119,6,0.3)' },
  bloqueio: { bg: 'rgba(220,38,38,0.1)', color: '#b91c1c', border: 'rgba(220,38,38,0.3)' },
}

const TYPE_CHIP: Record<FeriadoType, { bg: string; color: string }> = {
  feriado: { bg: '#dc2626', color: '#fff' },
  ponto_facultativo: { bg: '#7c3aed', color: '#fff' },
}

interface FormState {
  name: string
  type: FeriadoType
  scope: FeriadoScope
  recurrence: FeriadoRecurrence
  month: number
  day: number
  date: string
  impact: FeriadoImpact
  active: boolean
}

const BLANK_FORM: FormState = {
  name: '',
  type: 'feriado',
  scope: 'municipal',
  recurrence: 'anual',
  month: 1,
  day: 1,
  date: '',
  impact: 'visualizacao',
  active: true,
}

function daysInMonth(month: number): number {
  return new Date(2024, month, 0).getDate()
}

function formatRecurrence(f: Feriado): string {
  if (f.recurrence === 'anual' && f.month && f.day) {
    return `${String(f.day).padStart(2, '0')}/${String(f.month).padStart(2, '0')} (anual)`
  }
  if (f.recurrence === 'pontual' && f.date) {
    const [y, m, d] = f.date.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return '—'
}

interface ModalProps {
  form: FormState
  setForm: (fn: (prev: FormState) => FormState) => void
  onClose: () => void
  onSubmit: () => void
  saving: boolean
  error: string
  isEdit: boolean
}

function FeriadoModal({ form, setForm, onClose, onSubmit, saving, error, isEdit }: ModalProps) {
  const maxDay = daysInMonth(form.month)

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px',
        animation: 'modal-bg-in 0.18s ease both',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 10, width: '100%', maxWidth: 480,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
          animation: 'modal-panel-in 0.2s cubic-bezier(.34,1.56,.64,1) both',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{isEdit ? 'Editar Feriado' : 'Novo Feriado'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nome */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex.: Natal, Aniversário da Cidade…"
              maxLength={120}
            />
          </div>

          {/* Tipo + Abrangência */}
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tipo</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as FeriadoType }))}>
                <option value="feriado">Feriado</option>
                <option value="ponto_facultativo">Ponto Facultativo</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Abrangência</label>
              <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as FeriadoScope }))}>
                <option value="nacional">Nacional</option>
                <option value="estadual">Estadual</option>
                <option value="municipal">Municipal</option>
              </select>
            </div>
          </div>

          {/* Recorrência */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Recorrência</label>
            <select value={form.recurrence} onChange={(e) => setForm((f) => ({ ...f, recurrence: e.target.value as FeriadoRecurrence }))}>
              <option value="anual">Anual (mesma data todo ano)</option>
              <option value="pontual">Pontual (data específica)</option>
            </select>
          </div>

          {/* Campos de data dependendo da recorrência */}
          {form.recurrence === 'anual' ? (
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mês *</label>
                <select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value), day: Math.min(f.day, daysInMonth(Number(e.target.value))) }))}>
                  {MONTHS_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Dia *</label>
                <select value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}>
                  {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          )}

          {/* Impacto */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Impacto no calendário</label>
            <select value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value as FeriadoImpact }))}>
              <option value="visualizacao">Visualização — aparece no calendário</option>
              <option value="alerta">Alerta — avisa em prazos próximos</option>
              <option value="bloqueio">Bloqueio — avisa ao definir prazo nesta data</option>
            </select>
          </div>

          {/* Ativo */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Ativo (aparece no calendário)</span>
          </label>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn primary" onClick={onSubmit} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar feriado'}
          </button>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function FeriadosClient({ initialFeriados }: { initialFeriados: Feriado[] }) {
  const router = useRouter()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Feriado | null>(null)
  const [form, setFormRaw] = useState<FormState>(BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const setForm = useCallback((fn: (prev: FormState) => FormState) => {
    setFormRaw(fn)
    setModalError('')
  }, [])

  function openCreate() {
    setFormRaw(BLANK_FORM)
    setEditing(null)
    setModalError('')
    setModal('create')
  }

  function openEdit(f: Feriado) {
    setFormRaw({
      name: f.name,
      type: f.type,
      scope: f.scope,
      recurrence: f.recurrence,
      month: f.month ?? 1,
      day: f.day ?? 1,
      date: f.date ?? '',
      impact: f.impact,
      active: f.active,
    })
    setEditing(f)
    setModalError('')
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditing(null)
    setModalError('')
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setModalError('Informe o nome do feriado.'); return }
    if (form.recurrence === 'pontual' && !form.date) { setModalError('Informe a data.'); return }

    setSaving(true)
    setModalError('')

    const payload = {
      name: form.name,
      type: form.type,
      scope: form.scope,
      recurrence: form.recurrence,
      month: form.recurrence === 'anual' ? form.month : undefined,
      day: form.recurrence === 'anual' ? form.day : undefined,
      date: form.recurrence === 'pontual' ? form.date : undefined,
      impact: form.impact,
      active: form.active,
    }

    const url = modal === 'edit' && editing
      ? `/api/admin/feriados/${editing.id}`
      : '/api/admin/feriados'
    const method = modal === 'edit' ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) { setModalError(json.error ?? 'Erro ao salvar.'); return }

    closeModal()
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/admin/feriados/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (res.ok) router.refresh()
  }

  async function handleToggleActive(f: Feriado) {
    setTogglingId(f.id)
    await fetch(`/api/admin/feriados/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !f.active }),
    })
    setTogglingId(null)
    router.refresh()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Feriados e Pontos Facultativos</h1>
          <p className="sub">Datas que aparecem no calendário de todos os usuários</p>
        </div>
        <button className="btn primary" onClick={openCreate}>+ Novo feriado</button>
      </div>

      <div className="card">
        {initialFeriados.length === 0 ? (
          <div className="empty" style={{ padding: '48px 24px' }}>
            <p>Nenhum feriado cadastrado.</p>
            <button className="btn primary" onClick={openCreate} style={{ marginTop: 12 }}>Cadastrar primeiro feriado</button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="feriados-desktop-table table-wrap">
              <table className="t">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Abrangência</th>
                    <th>Data / Recorrência</th>
                    <th>Impacto</th>
                    <th>Status</th>
                    <th style={{ width: 96 }} />
                  </tr>
                </thead>
                <tbody>
                  {initialFeriados.map((f) => {
                    const typeStyle = TYPE_CHIP[f.type]
                    const impactStyle = IMPACT_COLORS[f.impact]
                    return (
                      <tr key={f.id} style={{ opacity: f.active ? 1 : 0.5 }}>
                        <td style={{ fontWeight: 500 }}>{f.name}</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 3,
                            fontSize: 11, fontWeight: 600,
                            background: typeStyle.bg, color: typeStyle.color,
                          }}>
                            {TYPE_LABELS[f.type]}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--muted)' }}>{SCOPE_LABELS[f.scope]}</td>
                        <td style={{ fontSize: 13 }}>{formatRecurrence(f)}</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 3,
                            fontSize: 11, fontWeight: 600,
                            background: impactStyle.bg, color: impactStyle.color,
                            border: `1px solid ${impactStyle.border}`,
                          }}>
                            {IMPACT_LABELS[f.impact]}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(f)}
                            disabled={togglingId === f.id}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 12, color: f.active ? '#16a34a' : 'var(--muted)',
                              fontWeight: 600, padding: '2px 0',
                            }}
                            title={f.active ? 'Clique para desativar' : 'Clique para ativar'}
                          >
                            {togglingId === f.id ? '…' : f.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button
                              className="btn ghost sm"
                              onClick={() => openEdit(f)}
                              style={{ fontSize: 12 }}
                            >
                              Editar
                            </button>
                            {confirmDeleteId === f.id ? (
                              <>
                                <button
                                  className="btn sm"
                                  style={{ background: 'var(--danger)', color: '#fff', border: 'none', fontSize: 12 }}
                                  disabled={deletingId === f.id}
                                  onClick={() => handleDelete(f.id)}
                                >
                                  {deletingId === f.id ? '…' : 'Confirmar'}
                                </button>
                                <button className="btn ghost sm" onClick={() => setConfirmDeleteId(null)} style={{ fontSize: 12 }}>
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn ghost sm"
                                onClick={() => setConfirmDeleteId(f.id)}
                                style={{ fontSize: 12, color: 'var(--danger)' }}
                              >
                                Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="feriados-mobile-list">
              {initialFeriados.map((f) => {
                const typeStyle = TYPE_CHIP[f.type]
                const impactStyle = IMPACT_COLORS[f.impact]
                return (
                  <div key={f.id} style={{
                    padding: '14px 16px', borderBottom: '1px solid var(--line-2)',
                    opacity: f.active ? 1 : 0.5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{f.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatRecurrence(f)} · {SCOPE_LABELS[f.scope]}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: typeStyle.bg, color: typeStyle.color }}>
                          {TYPE_LABELS[f.type]}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 600, background: impactStyle.bg, color: impactStyle.color, border: `1px solid ${impactStyle.border}` }}>
                          {IMPACT_LABELS[f.impact]}
                        </span>
                        <button
                          onClick={() => handleToggleActive(f)}
                          disabled={togglingId === f.id}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: f.active ? '#16a34a' : 'var(--muted)', fontWeight: 600, padding: 0 }}
                        >
                          {togglingId === f.id ? '…' : f.active ? '● Ativo' : '○ Inativo'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn ghost sm" onClick={() => openEdit(f)} style={{ fontSize: 11 }}>Editar</button>
                        {confirmDeleteId === f.id ? (
                          <>
                            <button
                              className="btn sm"
                              style={{ background: 'var(--danger)', color: '#fff', border: 'none', fontSize: 11 }}
                              disabled={deletingId === f.id}
                              onClick={() => handleDelete(f.id)}
                            >
                              {deletingId === f.id ? '…' : 'Confirmar'}
                            </button>
                            <button className="btn ghost sm" onClick={() => setConfirmDeleteId(null)} style={{ fontSize: 11 }}>✕</button>
                          </>
                        ) : (
                          <button
                            className="btn ghost sm"
                            onClick={() => setConfirmDeleteId(f.id)}
                            style={{ fontSize: 11, color: 'var(--danger)' }}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {modal && (
        <FeriadoModal
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={handleSubmit}
          saving={saving}
          error={modalError}
          isEdit={modal === 'edit'}
        />
      )}
    </>
  )
}
