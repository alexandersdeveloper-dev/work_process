'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useUser } from '@/lib/user-context'
import { useShell } from '@/components/shell/ShellProvider'
import { canManageFolgas } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase'
import AusenciaDrawer from './AusenciaDrawer'
import EditFolgaModal from './EditFolgaModal'
import CalendarioSkeleton from './CalendarioSkeleton'
import type { Folga, Feriado, ProcessDeadline } from '@/types'
import { getPascalDate } from '@/lib/easter'
import { useFolgas, useInvalidateFolgas } from '@/hooks/use-folgas'
import { useDeadlines } from '@/hooks/use-deadlines'
import { useFeriados } from '@/hooks/use-feriados'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function pad(n: number) { return String(n).padStart(2, '0') }

function isoDate(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`
}

function fmtLong(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtShort(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function folgasForDay(folgas: Folga[], key: string, currentUserId?: string): Folga[] {
  return folgas
    .filter((f) => f.end_date ? f.date <= key && key <= f.end_date : f.date === key)
    .sort((a, b) => {
      if (a.user_id === currentUserId) return -1
      if (b.user_id === currentUserId) return 1
      return 0
    })
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Ativo', in_progress: 'Em andamento', delayed: 'Atrasado',
  pending: 'Pendente', on_hold: 'Pausado',
}
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
}

const FERIADO_TYPE_LABELS: Record<string, string> = {
  feriado: 'Feriado',
  ponto_facultativo: 'Ponto Facultativo',
}
const FERIADO_SCOPE_LABELS: Record<string, string> = {
  nacional: 'Nacional',
  estadual: 'Estadual',
  municipal: 'Municipal',
}
const FERIADO_IMPACT_LABELS: Record<string, string> = {
  visualizacao: 'Visualização',
  alerta: 'Alerta',
  bloqueio: 'Bloqueio',
}

/* ---------- Popup de visualização ---------- */
function DayPopup({ date, folgas, deadlines, feriados, todayKey, canManage, onClose, onEdit, onDelete }: {
  date: string
  folgas: Folga[]
  deadlines: ProcessDeadline[]
  feriados: Feriado[]
  todayKey: string
  canManage: boolean
  onClose: () => void
  onEdit: (f: Folga) => void
  onDelete: (f: Folga) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(f: Folga) {
    setDeletingId(f.id)
    await onDelete(f)
    setDeletingId(null)
    setConfirmId(null)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px',
        animation: 'modal-bg-in 0.18s ease both',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8,
          width: '100%', maxWidth: 420,
          maxHeight: '100%',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
          animation: 'modal-panel-in 0.2s cubic-bezier(.34,1.56,.64,1) both',
          overflow: 'hidden',
        }}
      >
        {/* Header fixo */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '16px 20px', borderBottom: '1px solid var(--line)', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{fmtLong(date)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {[
                feriados.length > 0 && `${feriados.length} feriado${feriados.length !== 1 ? 's' : ''}`,
                folgas.length > 0 && `${folgas.length} ausência${folgas.length !== 1 ? 's' : ''}`,
                deadlines.length > 0 && `${deadlines.length} prazo${deadlines.length !== 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>✕</button>
        </div>

        {/* Lista rolável */}
        <div style={{ overflowY: 'auto', padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Feriados e pontos facultativos */}
          {feriados.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 2 }}>
                Feriados
              </div>
              {feriados.map((f) => {
                const isHoliday = f.type === 'feriado'
                const bg = isHoliday ? 'rgba(220,38,38,0.08)' : 'rgba(124,58,237,0.08)'
                const border = isHoliday ? 'rgba(220,38,38,0.2)' : 'rgba(124,58,237,0.2)'
                const color = isHoliday ? '#dc2626' : '#7c3aed'
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: bg, border: `1px solid ${border}` }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <rect x="2" y="3" width="12" height="12" rx="1" /><path d="M5 1v4M11 1v4M2 7h12" />
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {FERIADO_TYPE_LABELS[f.type]} · {FERIADO_SCOPE_LABELS[f.scope]}
                        {f.impact !== 'visualizacao' && (
                          <span style={{ marginLeft: 6, color, fontWeight: 600 }}>{FERIADO_IMPACT_LABELS[f.impact]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {(deadlines.length > 0 || folgas.length > 0) && (
                <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
              )}
            </>
          )}

          {/* Prazos de processos */}
          {deadlines.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 2 }}>
                Prazos
              </div>
              {deadlines.map((p) => {
                const overdue = p.deadline < todayKey
                return (
                  <a
                    key={p.id}
                    href={`/processes/${p.id}`}
                    onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 6, textDecoration: 'none',
                      background: overdue ? 'rgba(239,68,68,0.07)' : 'rgba(59,130,246,0.07)',
                      border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                      transition: 'background 0.12s',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={overdue ? '#ef4444' : '#3b82f6'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v3.5l2.5 1.5" />
                    </svg>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {STATUS_LABEL[p.status] ?? p.status} · {PRIORITY_LABEL[p.priority] ?? p.priority}
                        {overdue && <span style={{ color: '#ef4444', fontWeight: 600, marginLeft: 6 }}>Vencido</span>}
                      </div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M6 3l5 5-5 5" />
                    </svg>
                  </a>
                )
              })}
              {folgas.length > 0 && (
                <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
              )}
              {folgas.length > 0 && (
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 2 }}>
                  Ausências
                </div>
              )}
            </>
          )}

          {folgas.map((f) => (
            <div key={f.id} style={{
              padding: '8px 12px', borderRadius: 6,
              background: f.type === 'ferias' ? 'rgba(22,163,74,0.08)' : 'rgba(217,119,6,0.08)',
              border: `1px solid ${f.type === 'ferias' ? 'rgba(22,163,74,0.2)' : 'rgba(217,119,6,0.2)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{f.profile?.full_name ?? '—'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span className={`pill ${f.type === 'ferias' ? 'success' : 'warning'}`} style={{ fontSize: 10 }}>
                    {f.type === 'ferias' ? 'Férias' : 'Folga'}
                  </span>
                  {canManage && confirmId !== f.id && (
                    <>
                      <button
                        title="Editar"
                        onClick={() => { onEdit(f); onClose() }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <path d="M11 2l3 3-8 8H3v-3L11 2z" />
                        </svg>
                      </button>
                      <button
                        title="Excluir"
                        onClick={() => setConfirmId(f.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {confirmId === f.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '6px 8px', background: 'var(--panel-alt)', borderRadius: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>Excluir este registro?</span>
                  <button
                    className="btn sm"
                    style={{ background: 'var(--danger)', color: '#fff', border: 'none', fontSize: 11 }}
                    disabled={deletingId === f.id}
                    onClick={() => handleDelete(f)}
                  >
                    {deletingId === f.id ? '…' : 'Excluir'}
                  </button>
                  <button
                    className="btn ghost sm"
                    style={{ fontSize: 11 }}
                    onClick={() => setConfirmId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  {f.type === 'ferias' && f.end_date && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                      {fmtShort(f.date)} → {fmtShort(f.end_date)}
                    </div>
                  )}
                  {f.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{f.description}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ---------- Agenda view (mobile) ---------- */
interface AgendaViewProps {
  viewYear: number
  viewMonth: number
  daysInMonth: number
  todayKey: string
  folgasByDate: Map<string, Folga[]>
  deadlinesByDate: Map<string, ProcessDeadline[]>
  feriadosByDate: Map<string, Feriado[]>
  profileId?: string
  canAdd: boolean
  selectionMode: boolean
  selectedDays: string[]
  onDayClick: (key: string, hasFolga: boolean, hasDeadline: boolean) => void
}

function AgendaView({ viewYear, viewMonth, daysInMonth, todayKey, folgasByDate, deadlinesByDate, feriadosByDate, profileId, canAdd, selectionMode, selectedDays, onDayClick }: AgendaViewProps) {
  return (
    <div style={{ padding: '4px 16px 16px' }}>
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
        const key = isoDate(viewYear, viewMonth, day)
        const rawFolgas = folgasByDate.get(key) ?? []
        const dayFolgas = rawFolgas.length > 1 && profileId
          ? [...rawFolgas].sort((a, b) => (a.user_id === profileId ? -1 : b.user_id === profileId ? 1 : 0))
          : rawFolgas
        const rawDeadlines = deadlinesByDate.get(key) ?? []
        const dayDeadlines = rawDeadlines.length > 1 && profileId
          ? [...rawDeadlines].sort((a, b) => (a.owner_id === profileId ? -1 : b.owner_id === profileId ? 1 : 0))
          : rawDeadlines
        const dayFeriados = feriadosByDate.get(key) ?? []
        const hasFolga = dayFolgas.length > 0
        const hasDeadline = dayDeadlines.length > 0
        const hasFeriado = dayFeriados.length > 0
        const hasEvents = hasFolga || hasDeadline || hasFeriado
        const isT = todayKey === key
        const isSelected = selectedDays.includes(key)
        const isClickable = selectionMode || hasEvents || canAdd
        const weekday = new Date(viewYear, viewMonth, day)
          .toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

        return (
          <div
            key={day}
            onClick={() => isClickable && onDayClick(key, hasFolga, hasDeadline)}
            style={{
              display: 'flex', gap: 12,
              padding: isSelected ? '10px 8px' : '10px 0',
              borderBottom: '1px solid var(--line-2)',
              cursor: isClickable ? 'pointer' : 'default',
              background: isSelected ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
              borderRadius: isSelected ? 6 : 0,
              transition: 'background 0.12s',
            }}
          >
            {/* Coluna de data */}
            <div style={{ width: 38, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
              <span style={{
                fontSize: 17, fontFamily: 'var(--font-mono)', fontWeight: isT ? 700 : 400,
                lineHeight: 1,
                color: isSelected ? 'var(--accent)' : isT ? 'var(--accent)' : hasEvents ? 'var(--ink)' : 'var(--muted)',
              }}>
                {day}
              </span>
              <span style={{ fontSize: 9.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {weekday}
              </span>
            </div>

            {/* Coluna de eventos */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center', minWidth: 0 }}>
              {!isSelected && dayFeriados.map((feriado) => (
                <div key={feriado.id} style={{
                  fontSize: 12, borderRadius: 4, padding: '4px 8px',
                  background: feriado.type === 'feriado' ? 'rgba(220,38,38,0.10)' : 'rgba(124,58,237,0.10)',
                  border: `1px solid ${feriado.type === 'feriado' ? 'rgba(220,38,38,0.25)' : 'rgba(124,58,237,0.25)'}`,
                  color: feriado.type === 'feriado' ? '#b91c1c' : '#6d28d9',
                  fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {feriado.name}
                </div>
              ))}
              {!isSelected && dayFolgas.map(f => (
                <div key={f.id} style={{
                  fontSize: 12, borderRadius: 4, padding: '4px 8px',
                  background: f.type === 'ferias' ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.12)',
                  border: `1px solid ${f.type === 'ferias' ? 'rgba(22,163,74,0.25)' : 'rgba(217,119,6,0.25)'}`,
                  color: f.type === 'ferias' ? '#15803d' : '#92400e',
                  fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {f.profile?.full_name ?? '—'} · {f.type === 'ferias' ? 'Férias' : 'Folga'}
                </div>
              ))}
              {!isSelected && dayDeadlines.map(p => {
                const overdue = todayKey && p.deadline < todayKey
                return (
                  <div key={p.id} style={{
                    fontSize: 12, borderRadius: 4, padding: '4px 8px',
                    background: overdue ? 'rgba(239,68,68,0.10)' : 'rgba(59,130,246,0.10)',
                    border: `1px solid ${overdue ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'}`,
                    color: overdue ? '#dc2626' : '#2563eb',
                    fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <circle cx="8" cy="8" r="6" /><path d="M8 5v3.5l2 1.2" />
                    </svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                  </div>
                )
              })}
              {isSelected && (
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Selecionado ✓</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Componente principal ---------- */
export default function CalendarioClient() {
  const { profile } = useUser()
  const userId = profile?.id ?? ''
  const role = profile?.role ?? ''
  const canAdd = canManageFolgas(profile?.role)
  const { collapsed, setCollapsed } = useShell()
  const prevCollapsed = useRef(collapsed)

  const { data: folgas = [], isLoading: folgasLoading } = useFolgas(userId, role)
  const { data: deadlines = [], isLoading: deadlinesLoading } = useDeadlines(userId, role)
  const { data: feriados = [] } = useFeriados()
  const invalidateFolgas = useInvalidateFolgas()

  // Computado só no cliente para evitar hydration mismatch (servidor UTC vs browser local)
  const [todayKey, setTodayKey] = useState('')
  useEffect(() => {
    const d = new Date()
    setTodayKey(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }, [])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const initialDate = new Date()
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())
  const [popupDay, setPopupDay] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  // Auto-colapso da sidebar ao entrar no modo de seleção de dias
  useEffect(() => {
    if (selectionMode) {
      prevCollapsed.current = collapsed
      setCollapsed(true)
    } else {
      setCollapsed(prevCollapsed.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function handlePrint() {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDay = `${viewYear}-${pad(viewMonth + 1)}-01`
    const lastDay = `${viewYear}-${pad(viewMonth + 1)}-${pad(daysInMonth)}`

    const monthFolgas = folgas
      .filter((f) => f.date <= lastDay && (f.end_date ?? f.date) >= firstDay)

    // Agrupar por dia: uma linha por dia com ausências
    type DayEntry = { date: string; items: typeof monthFolgas }
    const dayEntries: DayEntry[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`
      const dayFolgas = monthFolgas
        .filter((f) => f.date <= key && key <= (f.end_date ?? f.date))
        .sort((a, b) => (a.profile?.full_name ?? '').localeCompare(b.profile?.full_name ?? ''))
      if (dayFolgas.length > 0) dayEntries.push({ date: key, items: dayFolgas })
    }

    // Contadores únicos de pessoas (não de dias)
    const uniqueFolga = new Set(monthFolgas.filter((f) => f.type === 'folga').map((f) => f.user_id)).size
    const uniqueFerias = new Set(monthFolgas.filter((f) => f.type === 'ferias').map((f) => f.user_id)).size

    function fmtDateRow(iso: string) {
      const [y, m, dd] = iso.split('-').map(Number)
      return new Date(y, m - 1, dd).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    }

    // Flatten to one row per (day × person), with rowspan on date cell
    const rows = dayEntries.map(({ date, items }, idx) => {
      const [y, m, d] = date.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      const dateFmt = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f7f8fa'
      const borderColor = idx % 2 === 0 ? '#e5e7eb' : '#dde1e7'

      const dateCell = `<td rowspan="${items.length}" style="
        background:${rowBg};vertical-align:middle;white-space:nowrap;
        padding:12px 16px;width:150px;
        border-right:1px solid ${borderColor};
        border-bottom:2px solid #d1d5db;
        font-size:13px;font-weight:600;color:#111;
        text-transform:capitalize;
      ">${dateFmt}</td>`

      return items.map((f, fi) => {
        const isFerias = f.type === 'ferias'
        const badgeBg   = isFerias ? '#dcfce7' : '#fef9c3'
        const badgeColor = isFerias ? '#15803d' : '#92400e'
        const badgeBorder = isFerias ? '#bbf7d0' : '#fde68a'
        const typeLabel = isFerias ? 'Férias' : 'Folga'
        const cellBorder = fi < items.length - 1
          ? `border-bottom:1px solid ${borderColor}`
          : `border-bottom:2px solid #d1d5db`
        const bg = `background:${rowBg}`

        return `<tr>
          ${fi === 0 ? dateCell : ''}
          <td style="${bg};${cellBorder};padding:12px 16px;font-size:13px;color:#111;vertical-align:middle">${f.profile?.full_name ?? '—'}</td>
          <td style="${bg};${cellBorder};padding:12px 16px;width:100px;vertical-align:middle;border-left:1px solid ${borderColor}">
            <span style="display:inline-block;padding:3px 10px;border-radius:4px;background:${badgeBg};color:${badgeColor};border:1px solid ${badgeBorder};font-size:11px;font-weight:700;letter-spacing:.03em;white-space:nowrap">${typeLabel}</span>
          </td>
          <td style="${bg};${cellBorder};padding:12px 16px;width:200px;font-size:12px;color:#6b7280;vertical-align:middle;border-left:1px solid ${borderColor}">${f.description ? f.description : '<span style="color:#d1d5db">—</span>'}</td>
        </tr>`
      }).join('')
    }).join('')

    const emptyMsg = `<tr><td colspan="4" style="color:#9ca3af;font-style:italic;text-align:center;padding:48px 20px;font-size:14px">Nenhuma ausência registrada neste mês.</td></tr>`
    const generatedAt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const totalAusencias = dayEntries.reduce((s, e) => s + e.items.length, 0)

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8">
<title>Folgas e Férias — ${MONTHS[viewMonth]} ${viewYear}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #fff; color: #111 }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important }
    @page { margin: 16mm 14mm }
  }
</style>
</head><body style="padding:0;margin:0">

<div style="border-bottom:4px solid #2C3947;padding:28px 40px 20px">
  <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px">Work Process · SIGA</div>
  <div style="font-size:24px;font-weight:800;color:#2C3947;margin-bottom:2px">Folgas e Férias</div>
  <div style="font-size:14px;font-weight:500;color:#374151">${MONTHS[viewMonth]} ${viewYear}</div>
  <div style="font-size:11px;color:#9ca3af;margin-top:5px">Gerado em ${generatedAt} · ${totalAusencias} registro${totalAusencias !== 1 ? 's' : ''} · ${dayEntries.length} dia${dayEntries.length !== 1 ? 's' : ''} com ausência</div>
</div>

<div style="padding:28px 40px 48px">
  <table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db">
    <thead>
      <tr style="background:#2C3947">
        <th style="text-align:left;padding:11px 16px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:#e2e8f0;width:150px;border-right:1px solid #3d5060">Data</th>
        <th style="text-align:left;padding:11px 16px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:#e2e8f0;border-right:1px solid #3d5060">Nome</th>
        <th style="text-align:left;padding:11px 16px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:#e2e8f0;width:100px;border-right:1px solid #3d5060">Tipo</th>
        <th style="text-align:left;padding:11px 16px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:#e2e8f0;width:200px">Descrição</th>
      </tr>
    </thead>
    <tbody>${dayEntries.length > 0 ? rows : emptyMsg}</tbody>
  </table>
</div>

<div style="padding:14px 40px 28px;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between">
  <span>Work Process / SIGA — Relatório gerado automaticamente</span>
  <span>${MONTHS[viewMonth]} ${viewYear}</span>
</div>

</body></html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (!win) return
    win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url) })
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function toggleDay(key: string) {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key].sort()
    )
  }

  function handleDayClick(key: string, hasFolga: boolean, hasDeadline: boolean) {
    if (selectionMode) {
      toggleDay(key)
      return
    }
    const hasFeriado = (feriadosByDate.get(key) ?? []).length > 0
    if (hasFolga || hasDeadline || hasFeriado) {
      setPopupDay(key)
      return
    }
    if (canAdd) {
      setSelectionMode(true)
      setSelectedDays([key])
    }
  }

  function cancelSelection() {
    setSelectionMode(false)
    setSelectedDays([])
  }

  function onRegistered() {
    cancelSelection()
    invalidateFolgas(userId, role)
  }

  // Pre-compute a date→Folga[] map once per folgas change instead of filtering 42× per render
  const folgasByDate = useMemo(() => {
    const map = new Map<string, Folga[]>()
    for (const f of folgas) {
      const endMs = new Date((f.end_date ?? f.date) + 'T12:00:00').getTime()
      let curMs = new Date(f.date + 'T12:00:00').getTime()
      while (curMs <= endMs) {
        const key = new Date(curMs).toISOString().slice(0, 10)
        const arr = map.get(key)
        if (arr) arr.push(f)
        else map.set(key, [f])
        curMs += 86400000
      }
    }
    return map
  }, [folgas])

  // Pre-compute date→ProcessDeadline[] map
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, ProcessDeadline[]>()
    for (const p of deadlines) {
      const key = p.deadline.slice(0, 10)
      const arr = map.get(key)
      if (arr) arr.push(p)
      else map.set(key, [p])
    }
    return map
  }, [deadlines])

  // Pre-compute date→Feriado[] map — anual/movel keyed to viewYear
  const feriadosByDate = useMemo(() => {
    const map = new Map<string, Feriado[]>()
    for (const f of feriados) {
      let key: string | null = null
      if (f.recurrence === 'pontual' && f.date) {
        key = f.date
      } else if (f.recurrence === 'anual' && f.month !== null && f.day !== null) {
        key = `${viewYear}-${pad(f.month)}-${pad(f.day)}`
      } else if (f.recurrence === 'movel' && f.month !== null && f.week_of_month !== null && f.weekday !== null) {
        // Find the Nth occurrence of weekday in that month/year
        const firstDayOfMonth = new Date(viewYear, f.month - 1, 1).getDay()
        const daysToFirst = (f.weekday - firstDayOfMonth + 7) % 7
        const nthDay = 1 + daysToFirst + (f.week_of_month - 1) * 7
        const maxDay = new Date(viewYear, f.month, 0).getDate()
        if (nthDay <= maxDay) {
          key = `${viewYear}-${pad(f.month)}-${pad(nthDay)}`
        }
      } else if (f.recurrence === 'pascal' && f.pascal_offset !== null) {
        key = getPascalDate(viewYear, f.pascal_offset)
      }
      if (key) {
        const arr = map.get(key)
        if (arr) arr.push(f)
        else map.set(key, [f])
      }
    }
    return map
  }, [feriados, viewYear])

  const [editingFolga, setEditingFolga] = useState<Folga | null>(null)

  async function handleDeleteFolga(f: Folga) {
    const supabase = createClient()
    await supabase.from('folgas').delete().eq('id', f.id)
    invalidateFolgas(userId, role)
  }

  const closePopup = useCallback(() => setPopupDay(null), [])

  if (folgasLoading || deadlinesLoading) return <CalendarioSkeleton />

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendário</h1>
          <p className="sub">
            {selectionMode
              ? `${selectedDays.length} dia${selectedDays.length !== 1 ? 's' : ''} selecionado${selectedDays.length !== 1 ? 's' : ''} — clique para adicionar ou remover`
              : 'Folgas e férias da equipe'}
          </p>
        </div>
        {canAdd && (
          selectionMode
            ? <button className="btn ghost" onClick={cancelSelection}>✕ Cancelar seleção</button>
            : <button className="btn primary" onClick={() => setSelectionMode(true)}>+ Registrar ausência</button>
        )}
      </div>

      <div className="cal-layout">

        {/* Calendário */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card">
            {/* Nav mês */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
              <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 4, width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)' }}>‹</button>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 4, width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)' }}>›</button>
            </div>

            {isMobile ? (
              <AgendaView
                viewYear={viewYear}
                viewMonth={viewMonth}
                daysInMonth={daysInMonth}
                todayKey={todayKey}
                folgasByDate={folgasByDate}
                deadlinesByDate={deadlinesByDate}
                feriadosByDate={feriadosByDate}
                profileId={profile?.id}
                canAdd={canAdd}
                selectionMode={selectionMode}
                selectedDays={selectedDays}
                onDayClick={handleDayClick}
              />
            ) : (
              <div style={{ padding: '16px 20px 20px' }}>
                {/* Cabeçalho dias semana */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
                  {WEEKDAYS.map((d) => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--muted)', letterSpacing: '0.06em', padding: '4px 0' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid de dias */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {cells.map((day, i) => {
                    if (!day) return <div key={i} />
                    const key = isoDate(viewYear, viewMonth, day)
                    const rawFolgas = folgasByDate.get(key) ?? []
                    const dayFolgas = rawFolgas.length > 1 && profile?.id
                      ? [...rawFolgas].sort((a, b) => (a.user_id === profile.id ? -1 : b.user_id === profile.id ? 1 : 0))
                      : rawFolgas
                    const rawDeadlines = deadlinesByDate.get(key) ?? []
                    const dayDeadlines = rawDeadlines.length > 1 && profile?.id
                      ? [...rawDeadlines].sort((a, b) => (a.owner_id === profile.id ? -1 : b.owner_id === profile.id ? 1 : 0))
                      : rawDeadlines
                    const dayFeriados = feriadosByDate.get(key) ?? []
                    const hasFolga = dayFolgas.length > 0
                    const hasDeadline = dayDeadlines.length > 0
                    const hasFeriado = dayFeriados.length > 0
                    const isT = todayKey === key
                    const isSelected = selectedDays.includes(key)
                    const isClickable = selectionMode || hasFolga || hasDeadline || hasFeriado || canAdd

                    const shownFeriados = dayFeriados.slice(0, 1)
                    const shownFolgas = dayFolgas.slice(0, 2)
                    const shownDeadlines = dayDeadlines.slice(0, 2)
                    const overflow = (dayFeriados.length - shownFeriados.length) + (dayFolgas.length - shownFolgas.length) + (dayDeadlines.length - shownDeadlines.length)

                    return (
                      <div
                        key={i}
                        onClick={() => isClickable && handleDayClick(key, hasFolga, hasDeadline)}
                        className="cal-cell"
                        style={{
                          padding: '6px 8px',
                          position: 'relative',
                          background: isSelected
                            ? 'var(--accent)'
                            : isT
                            ? 'var(--panel-alt)'
                            : hasFolga || hasDeadline || hasFeriado
                            ? 'var(--panel-alt)'
                            : 'transparent',
                          border: isSelected
                            ? '2px solid var(--accent)'
                            : isT
                            ? '2px solid var(--accent)'
                            : '1px solid transparent',
                          cursor: isClickable ? 'pointer' : 'default',
                          transition: 'background 0.12s, border-color 0.12s',
                          outline: selectionMode && !isSelected ? '1px dashed var(--line)' : 'none',
                        }}
                      >
                        <div style={{
                          fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: isT ? 700 : 400,
                          color: isSelected ? 'var(--bg)' : isT ? 'var(--accent)' : 'var(--ink-2)',
                          marginBottom: 4,
                        }}>
                          {day}
                        </div>

                        {!isSelected && (hasFolga || hasDeadline || hasFeriado) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: overflow > 0 ? 14 : 0 }}>
                            {shownFeriados.map((feriado) => (
                              <div key={feriado.id} style={{
                                fontSize: 10, borderRadius: 2, padding: '1px 5px',
                                background: feriado.type === 'feriado' ? '#dc2626' : '#7c3aed',
                                color: '#fff',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                fontWeight: 500,
                              }}>
                                {feriado.name}
                              </div>
                            ))}
                            {shownFolgas.map((f) => (
                              <div key={f.id} style={{
                                fontSize: 10, borderRadius: 2, padding: '1px 5px',
                                background: f.type === 'ferias' ? '#16a34a' : '#d97706',
                                color: '#fff',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {f.profile?.full_name ?? '—'}
                              </div>
                            ))}
                            {shownDeadlines.map((p) => {
                              const overdue = todayKey && p.deadline < todayKey
                              return (
                                <div key={p.id} style={{
                                  fontSize: 10, borderRadius: 2, padding: '1px 5px',
                                  background: overdue ? '#ef4444' : '#3b82f6',
                                  color: '#fff',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>
                                  <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                                    <circle cx="8" cy="8" r="6" /><path d="M8 5v3.5l2 1.2" />
                                  </svg>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {!isSelected && overflow > 0 && (
                          <div style={{
                            position: 'absolute', bottom: 4, left: 8, right: 8,
                            fontSize: 10, color: 'var(--muted)',
                            background: 'linear-gradient(to bottom, transparent, var(--panel-alt) 40%)',
                            paddingTop: 6,
                          }}>
                            +{overflow} mais
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Legenda + PDF */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#dc2626', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Feriado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#7c3aed', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Ponto Facultativo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Folga</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Férias</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Prazo</span>
                </div>
              </div>
              <button className="btn ghost sm" onClick={handlePrint} title="Baixar PDF do mês">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginRight: 5 }}>
                  <path d="M8 2v8M5 7l3 3 3-3" />
                  <path d="M3 12h10" />
                </svg>
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Drawer de registro */}
        {selectionMode && (
          <AusenciaDrawer
            selectedDays={selectedDays}
            onRemoveDay={(d) => setSelectedDays((prev) => prev.filter((x) => x !== d))}
            onClose={cancelSelection}
            onRegistered={onRegistered}
          />
        )}
      </div>

      {/* Popup de visualização */}
      {popupDay && !selectionMode && (
        <DayPopup
          date={popupDay}
          folgas={(() => {
            const raw = folgasByDate.get(popupDay) ?? []
            return raw.length > 1 && profile?.id
              ? [...raw].sort((a, b) => (a.user_id === profile.id ? -1 : b.user_id === profile.id ? 1 : 0))
              : raw
          })()}
          deadlines={(() => {
            const raw = deadlinesByDate.get(popupDay) ?? []
            return raw.length > 1 && profile?.id
              ? [...raw].sort((a, b) => (a.owner_id === profile.id ? -1 : b.owner_id === profile.id ? 1 : 0))
              : raw
          })()}
          feriados={feriadosByDate.get(popupDay) ?? []}
          todayKey={todayKey}
          canManage={canAdd}
          onClose={closePopup}
          onEdit={(f) => { setEditingFolga(f); setPopupDay(null) }}
          onDelete={handleDeleteFolga}
        />
      )}

      {editingFolga && (
        <EditFolgaModal
          folga={editingFolga}
          onClose={() => setEditingFolga(null)}
          onSaved={() => { setEditingFolga(null); invalidateFolgas(userId, role) }}
        />
      )}
    </>
  )
}
