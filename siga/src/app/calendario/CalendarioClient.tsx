'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { canManageFolgas } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase'
import AusenciaDrawer from './AusenciaDrawer'
import EditFolgaModal from './EditFolgaModal'
import type { Folga } from '@/types'

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

/* ---------- Popup de visualização ---------- */
function DayPopup({ date, folgas, canManage, onClose, onEdit, onDelete }: {
  date: string
  folgas: Folga[]
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
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', zIndex: 101,
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8,
        width: '100%', maxWidth: 400, padding: 20,
        boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
        animation: 'modal-panel-in 0.2s cubic-bezier(.34,1.56,.64,1) both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{fmtLong(date)}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {folgas.length} ausência{folgas.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

              {/* Confirmação inline de exclusão */}
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
    </>,
    document.body
  )
}

/* ---------- Componente principal ---------- */
export default function CalendarioClient({ folgas }: { folgas: Folga[] }) {
  const { profile } = useUser()
  const canAdd = canManageFolgas(profile?.role)
  const router = useRouter()

  // Computado só no cliente para evitar hydration mismatch (servidor UTC vs browser local)
  const [todayKey, setTodayKey] = useState('')
  useEffect(() => {
    const d = new Date()
    setTodayKey(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }, [])

  const initialDate = new Date()
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())
  const [popupDay, setPopupDay] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

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

    const rows = dayEntries.map(({ date, items }, idx) => {
      const [y, m, d] = date.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })
      const dayNum = dateObj.toLocaleDateString('pt-BR', { day: '2-digit' })
      const monthLabel = dateObj.toLocaleDateString('pt-BR', { month: 'short' })
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f9fafb'

      const peopleRows = items.map((f) => {
        const isFerias = f.type === 'ferias'
        const badgeBg = isFerias ? '#dcfce7' : '#fef9c3'
        const badgeColor = isFerias ? '#15803d' : '#92400e'
        const badgeBorder = isFerias ? '#bbf7d0' : '#fde68a'
        const typeLabel = isFerias ? 'Férias' : 'Folga'
        const note = f.description ? `<span style="color:#9ca3af;font-size:11px;margin-left:6px">${f.description}</span>` : ''
        return `<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid #f3f4f6">
          <span style="font-size:13px;font-weight:500;color:#111;flex:1">${f.profile?.full_name ?? '—'}</span>
          <span style="display:inline-block;padding:3px 10px;border-radius:4px;background:${badgeBg};color:${badgeColor};border:1px solid ${badgeBorder};font-size:10px;font-weight:700;letter-spacing:.04em;white-space:nowrap">${typeLabel}</span>
          ${note}
        </div>`
      }).join('')

      return `<tr>
        <td style="background:${rowBg};vertical-align:top;padding:14px 16px 14px 20px;width:140px;white-space:nowrap;border-bottom:1px solid #e5e7eb">
          <div style="font-size:22px;font-weight:700;color:#111;line-height:1">${dayNum}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:3px;text-transform:capitalize">${weekday}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:1px;text-transform:capitalize">${monthLabel} ${y}</div>
        </td>
        <td style="background:${rowBg};padding:10px 20px 10px 16px;border-bottom:1px solid #e5e7eb;vertical-align:top">
          <div style="display:flex;flex-direction:column">
            ${peopleRows}
          </div>
          <div style="font-size:11px;color:#9ca3af;margin-top:6px">${items.length} ausência${items.length !== 1 ? 's' : ''}</div>
        </td>
      </tr>`
    }).join('')

    const emptyMsg = `<tr><td colspan="2" style="color:#9ca3af;font-style:italic;text-align:center;padding:48px 20px;font-size:14px">Nenhuma ausência registrada neste mês.</td></tr>`
    const generatedAt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const statCards = [
      uniqueFolga > 0 ? `<div style="padding:14px 20px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;min-width:140px">
        <div style="font-size:24px;font-weight:700;color:#92400e">${uniqueFolga}</div>
        <div style="font-size:11px;color:#b45309;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Servidor${uniqueFolga !== 1 ? 'es' : ''} com folga</div>
      </div>` : '',
      uniqueFerias > 0 ? `<div style="padding:14px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;min-width:140px">
        <div style="font-size:24px;font-weight:700;color:#15803d">${uniqueFerias}</div>
        <div style="font-size:11px;color:#16a34a;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Servidor${uniqueFerias !== 1 ? 'es' : ''} em férias</div>
      </div>` : '',
      `<div style="padding:14px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;min-width:140px">
        <div style="font-size:24px;font-weight:700;color:#334155">${dayEntries.length}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Dia${dayEntries.length !== 1 ? 's' : ''} com ausência</div>
      </div>`,
    ].filter(Boolean).join('')

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8">
<title>Folgas e Férias — ${MONTHS[viewMonth]} ${viewYear}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #fff; color: #111 }
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important }
    @page { margin: 18mm 16mm }
    .no-print { display: none }
  }
</style>
</head><body style="padding:0;margin:0">

<div style="border-bottom:4px solid #1e3a5f;padding:32px 40px 24px;background:#fff">
  <div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;margin-bottom:8px">Work Process · SIGA</div>
  <div style="font-size:26px;font-weight:800;color:#1e3a5f;margin-bottom:4px">Folgas e Férias</div>
  <div style="font-size:16px;font-weight:500;color:#374151">${MONTHS[viewMonth]} ${viewYear}</div>
  <div style="font-size:11px;color:#9ca3af;margin-top:6px">Gerado em ${generatedAt}</div>
</div>

${dayEntries.length > 0 ? `<div style="padding:24px 40px;display:flex;gap:12px;flex-wrap:wrap;border-bottom:1px solid #e5e7eb">${statCards}</div>` : ''}

<div style="padding:24px 40px 40px">
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <thead>
      <tr style="background:#f8fafc;border-bottom:2px solid #e5e7eb">
        <th style="text-align:left;padding:12px 16px 12px 20px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:#6b7280;width:140px">Data</th>
        <th style="text-align:left;padding:12px 20px 12px 16px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:700;color:#6b7280">Ausências</th>
      </tr>
    </thead>
    <tbody>${dayEntries.length > 0 ? rows : emptyMsg}</tbody>
  </table>
</div>

<div style="padding:16px 40px 32px;font-size:11px;color:#9ca3af;border-top:1px solid #f3f4f6;display:flex;justify-content:space-between;align-items:center">
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

  function handleDayClick(key: string, hasFolga: boolean) {
    if (selectionMode) {
      toggleDay(key)
      return
    }
    if (hasFolga) {
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
    router.refresh()
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

  const [editingFolga, setEditingFolga] = useState<Folga | null>(null)

  async function handleDeleteFolga(f: Folga) {
    const supabase = createClient()
    await supabase.from('folgas').delete().eq('id', f.id)
    router.refresh()
  }

  const closePopup = useCallback(() => setPopupDay(null), [])

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

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

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
                  const hasFolga = dayFolgas.length > 0
                  const isT = todayKey === key
                  const isSelected = selectedDays.includes(key)
                  const isClickable = selectionMode || hasFolga || canAdd

                  return (
                    <div
                      key={i}
                      onClick={() => isClickable && handleDayClick(key, hasFolga)}
                      style={{
                        minHeight: 60, borderRadius: 6, padding: '6px 8px',
                        background: isSelected
                          ? 'var(--accent)'
                          : isT
                          ? 'var(--panel-alt)'
                          : hasFolga
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

                      {!isSelected && dayFolgas.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {dayFolgas.slice(0, 2).map((f) => (
                            <div key={f.id} style={{
                              fontSize: 10, borderRadius: 2, padding: '1px 5px',
                              background: f.type === 'ferias' ? '#16a34a' : '#d97706',
                              color: '#fff',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {f.profile?.full_name ?? '—'}
                            </div>
                          ))}
                          {dayFolgas.length > 2 && (
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>+{dayFolgas.length - 2}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legenda + PDF */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Folga</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#16a34a', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Férias</span>
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
          onSaved={() => { setEditingFolga(null); router.refresh() }}
        />
      )}
    </>
  )
}
