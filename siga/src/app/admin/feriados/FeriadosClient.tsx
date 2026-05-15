'use client'

import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Feriado, FeriadoType, FeriadoScope, FeriadoRecurrence, FeriadoImpact } from '@/types'
import { getPascalDate } from '@/lib/easter'
import { useFeriados, useToggleFeriadoActive, useDeleteFeriado, useCreateFeriado, useUpdateFeriado } from '@/hooks/use-feriados'
import { useActionLoader } from '@/contexts/ActionLoaderContext'
import { useToast } from '@/contexts/ToastContext'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WEEKDAYS_PT = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const WEEK_ORDINALS = ['1ª','2ª','3ª','4ª']

const PASCAL_PRESETS = [
  { label: 'Carnaval — Segunda-feira (Páscoa − 48)', offset: -48 },
  { label: 'Carnaval — Terça-feira (Páscoa − 47)',  offset: -47 },
  { label: 'Quarta-feira de Cinzas (Páscoa − 46)',   offset: -46 },
  { label: 'Sexta-feira Santa / Paixão de Cristo (Páscoa − 2)', offset: -2 },
  { label: 'Páscoa (offset 0)',                     offset:   0 },
  { label: 'Corpus Christi (Páscoa + 60)',           offset:  60 },
] as const

const PASCAL_OFFSET_LABELS: Record<number, string> = {
  '-48': 'Carnaval (seg.)',
  '-47': 'Carnaval (ter.)',
  '-46': 'Quarta de Cinzas',
  '-2':  'Sexta-feira Santa',
  '0':   'Páscoa',
  '60':  'Corpus Christi',
}

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
  week_of_month: number
  weekday: number
  pascal_offset: number
  pascal_custom: boolean
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
  week_of_month: 2,
  weekday: 0,
  pascal_offset: -2,
  pascal_custom: false,
  date: '',
  impact: 'visualizacao',
  active: true,
}

function daysInMonth(month: number): number {
  return new Date(2024, month, 0).getDate()
}

function formatPascalOffset(offset: number): string {
  const known = PASCAL_OFFSET_LABELS[offset]
  if (offset === 0) return 'Páscoa'
  const sign = offset > 0 ? `+ ${offset}` : `− ${Math.abs(offset)}`
  return known ? `${known} (Páscoa ${sign} dias)` : `Páscoa ${sign} dias`
}

function formatRecurrence(f: Feriado): string {
  if (f.recurrence === 'anual' && f.month && f.day) {
    return `${String(f.day).padStart(2, '0')}/${String(f.month).padStart(2, '0')} (anual)`
  }
  if (f.recurrence === 'movel' && f.month && f.week_of_month !== null && f.weekday !== null) {
    return `${WEEK_ORDINALS[f.week_of_month - 1]} ${WEEKDAYS_PT[f.weekday]} de ${MONTHS_PT[f.month - 1]}`
  }
  if (f.recurrence === 'pascal' && f.pascal_offset !== null) {
    const thisYear = new Date().getFullYear()
    const date = getPascalDate(thisYear, f.pascal_offset)
    const [y, m, d] = date.split('-').map(Number)
    const formatted = new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return `${formatPascalOffset(f.pascal_offset)} — ${formatted}/${thisYear}`
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
              <option value="anual">Anual — mesma data todo ano (ex: 25/12)</option>
              <option value="movel">Móvel — Nº dia da semana do mês (ex: 2º domingo de maio)</option>
              <option value="pascal">Pascal — relativo à Páscoa (Carnaval, Corpus Christi…)</option>
              <option value="pontual">Pontual — data específica única</option>
            </select>
          </div>

          {/* Campos de data dependendo da recorrência */}
          {form.recurrence === 'anual' && (
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
          )}

          {form.recurrence === 'movel' && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mês *</label>
                <select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}>
                  {MONTHS_PT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Semana *</label>
                  <select value={form.week_of_month} onChange={(e) => setForm((f) => ({ ...f, week_of_month: Number(e.target.value) }))}>
                    {WEEK_ORDINALS.map((o, i) => <option key={i} value={i + 1}>{o} semana</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Dia da semana *</label>
                  <select value={form.weekday} onChange={(e) => setForm((f) => ({ ...f, weekday: Number(e.target.value) }))}>
                    {WEEKDAYS_PT.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 10px', background: 'var(--panel-alt)', borderRadius: 6 }}>
                Exemplo: {WEEK_ORDINALS[form.week_of_month - 1]} {WEEKDAYS_PT[form.weekday]} de {MONTHS_PT[form.month - 1]}
              </div>
            </>
          )}

          {form.recurrence === 'pascal' && (() => {
            const thisYear = new Date().getFullYear()
            const previewDate = getPascalDate(thisYear, form.pascal_offset)
            const [py, pm, pd] = previewDate.split('-').map(Number)
            const previewFormatted = new Date(py, pm - 1, pd).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
            const isPreset = PASCAL_PRESETS.some((p) => p.offset === form.pascal_offset)
            return (
              <>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Feriado pascal</label>
                  <select
                    value={form.pascal_custom ? 'custom' : String(form.pascal_offset)}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setForm((f) => ({ ...f, pascal_custom: true }))
                      } else {
                        setForm((f) => ({ ...f, pascal_offset: Number(e.target.value), pascal_custom: false }))
                      }
                    }}
                  >
                    {PASCAL_PRESETS.map((p) => (
                      <option key={p.offset} value={String(p.offset)}>{p.label}</option>
                    ))}
                    <option value="custom">Personalizado (offset manual)…</option>
                  </select>
                </div>
                {(form.pascal_custom || !isPreset) && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Offset em dias (negativo = antes da Páscoa)</label>
                    <input
                      type="number"
                      value={form.pascal_offset}
                      min={-60}
                      max={100}
                      onChange={(e) => setForm((f) => ({ ...f, pascal_offset: Number(e.target.value), pascal_custom: true }))}
                    />
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 10px', background: 'var(--panel-alt)', borderRadius: 6 }}>
                  Em {thisYear}: <strong style={{ color: 'var(--ink)' }}>{previewFormatted}</strong>
                </div>
              </>
            )
          })()}

          {form.recurrence === 'pontual' && (
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
  const { data: feriados = initialFeriados } = useFeriados(initialFeriados)
  const toggleActive = useToggleFeriadoActive()
  const deleteFeriado = useDeleteFeriado()
  const createFeriado = useCreateFeriado()
  const updateFeriado = useUpdateFeriado()
  const { showLoader, hideLoader } = useActionLoader()
  const { showToast } = useToast()

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Feriado | null>(null)
  const [form, setFormRaw] = useState<FormState>(BLANK_FORM)
  const [modalError, setModalError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const saving = createFeriado.isPending || updateFeriado.isPending
  const deletingId = deleteFeriado.isPending ? deleteFeriado.variables as string : null
  const togglingId = toggleActive.isPending ? (toggleActive.variables as { id: string })?.id : null

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
      week_of_month: f.week_of_month ?? 2,
      weekday: f.weekday ?? 0,
      pascal_offset: f.pascal_offset ?? -2,
      pascal_custom: false,
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

    setModalError('')

    const payload = {
      name: form.name,
      type: form.type,
      scope: form.scope,
      recurrence: form.recurrence,
      month: (form.recurrence === 'anual' || form.recurrence === 'movel') ? form.month : undefined,
      day: form.recurrence === 'anual' ? form.day : undefined,
      week_of_month: form.recurrence === 'movel' ? form.week_of_month : undefined,
      weekday: form.recurrence === 'movel' ? form.weekday : undefined,
      pascal_offset: form.recurrence === 'pascal' ? form.pascal_offset : undefined,
      date: form.recurrence === 'pontual' ? form.date : undefined,
      impact: form.impact,
      active: form.active,
    }

    try {
      showLoader()
      if (modal === 'edit' && editing) {
        await updateFeriado.mutateAsync({ id: editing.id, body: payload })
        showToast('Feriado atualizado')
      } else {
        await createFeriado.mutateAsync(payload)
        showToast('Feriado criado')
      }
      closeModal()
    } catch {
      showToast('Erro ao salvar feriado.', 'error')
    } finally {
      hideLoader()
    }
  }

  async function handleDelete(id: string) {
    try {
      showLoader()
      await deleteFeriado.mutateAsync(id)
      setConfirmDeleteId(null)
      showToast('Feriado excluído')
    } catch {
      showToast('Erro ao excluir feriado.', 'error')
    } finally {
      hideLoader()
    }
  }

  function handleToggleActive(f: Feriado) {
    showLoader()
    toggleActive.mutate(
      { id: f.id, active: !f.active },
      {
        onSuccess: () => showToast(f.active ? 'Feriado desativado' : 'Feriado ativado'),
        onError: () => showToast('Erro ao atualizar feriado.', 'error'),
        onSettled: () => hideLoader(),
      }
    )
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
        {feriados.length === 0 ? (
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
                  {feriados.map((f) => {
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
              {feriados.map((f) => {
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
