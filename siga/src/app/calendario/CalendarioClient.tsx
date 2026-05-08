'use client'

import { useState, useCallback, useEffect } from 'react'
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

  return (
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
    </>
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
    const firstDay = `${viewYear}-${pad(viewMonth + 1)}-01`
    const lastDay = `${viewYear}-${pad(viewMonth + 1)}-${pad(new Date(viewYear, viewMonth + 1, 0).getDate())}`

    const monthFolgas = folgas
      .filter((f) => f.date <= lastDay && (f.end_date ?? f.date) >= firstDay)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.profile?.full_name ?? '').localeCompare(b.profile?.full_name ?? ''))

    const countFolga = monthFolgas.filter((f) => f.type === 'folga').length
    const countFerias = monthFolgas.filter((f) => f.type === 'ferias').length

    const rows = monthFolgas.map((f) => {
      const end = f.end_date ?? f.date
      const dateStr = end !== f.date ? `${fmtShort(f.date)} → ${fmtShort(end)}` : fmtShort(f.date)
      const isFerias = f.type === 'ferias'
      const borderColor = isFerias ? '#16a34a' : '#d97706'
      const badgeBg = isFerias ? '#dcfce7' : '#fef3c7'
      const badgeColor = isFerias ? '#15803d' : '#b45309'
      const typeLabel = isFerias ? 'Férias' : 'Folga'
      const cargo = (f.profile as { full_name?: string; cargo?: string | null } | undefined)?.cargo
      return `<tr>
        <td style="border-left:3px solid ${borderColor};padding-left:14px">
          <div style="font-weight:600;color:#111;font-size:13px">${f.profile?.full_name ?? '—'}</div>
          ${cargo ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${cargo}</div>` : ''}
        </td>
        <td><span style="display:inline-block;padding:3px 10px;border-radius:20px;background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:600;letter-spacing:.03em">${typeLabel}</span></td>
        <td style="color:#374151;font-size:13px">${dateStr}</td>
        <td style="color:#6b7280;font-size:12px">${f.description ?? ''}</td>
      </tr>`
    }).join('')

    const emptyMsg = '<tr><td colspan="4" style="color:#9ca3af;font-style:italic;text-align:center;padding:32px 12px">Nenhuma ausência registrada neste mês.</td></tr>'
    const generatedAt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

    const summaryItems = [
      countFolga > 0 ? `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#d97706;display:inline-block"></span>${countFolga} folga${countFolga !== 1 ? 's' : ''}</span>` : '',
      countFerias > 0 ? `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#16a34a;display:inline-block"></span>${countFerias} férias</span>` : '',
    ].filter(Boolean).join('<span style="margin:0 8px;color:#d1d5db">·</span>')

    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8">
<title>Folgas e Férias — ${MONTHS[viewMonth]} ${viewYear}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; font-size: 13px }
  .header { background: #fff; color: #2C3947; padding: 28px 40px 24px; border-bottom: 3px solid #2C3947 }
  .header-brand { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; opacity: .55; margin-bottom: 6px }
  .header-title { font-size: 22px; font-weight: 700; margin-bottom: 4px }
  .header-meta { font-size: 12px; opacity: .55 }
  .body { padding: 32px 40px 48px }
  .summary { display: flex; gap: 12px; align-items: center; margin-bottom: 28px; font-size: 13px; color: #374151; flex-wrap: wrap }
  .summary-total { font-weight: 700; font-size: 15px; color: #111; margin-right: 4px }
  table { width: 100%; border-collapse: collapse }
  thead tr { border-bottom: 2px solid #e5e7eb }
  th { text-align: left; padding: 10px 14px; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; color: #6b7280 }
  td { padding: 16px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: middle }
  tr:last-child td { border-bottom: none }
  .footer { padding: 0 40px 32px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; margin-top: 8px }
  @media print {
    .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; border-bottom: 3px solid #2C3947 }
    .body { padding: 24px 32px 40px }
    .header { padding: 22px 32px 20px }
  }
</style>
</head><body>
<div class="header">
  <div class="header-brand">Work Process · SIGA</div>
  <div class="header-title">Folgas e Férias — ${MONTHS[viewMonth]} ${viewYear}</div>
  <div class="header-meta">Gerado em ${generatedAt}</div>
</div>
<div class="body">
  ${monthFolgas.length > 0 ? `<div class="summary"><span class="summary-total">${monthFolgas.length} registro${monthFolgas.length !== 1 ? 's' : ''}</span>${summaryItems}</div>` : ''}
  <table>
    <thead><tr><th>Servidor</th><th>Tipo</th><th>Período</th><th>Observação</th></tr></thead>
    <tbody>${monthFolgas.length > 0 ? rows : emptyMsg}</tbody>
  </table>
</div>
<div class="footer">Work Process / SIGA · Relatório gerado automaticamente</div>
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
                  const dayFolgas = folgasForDay(folgas, key, profile?.id)
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
          folgas={folgasForDay(folgas, popupDay, profile?.id)}
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
