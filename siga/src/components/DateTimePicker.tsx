'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

interface Props {
  value: string
  onChange: (iso: string) => void
  maxNow?: boolean
  placeholder?: string
}

function parseISO(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function pad(n: number) { return String(n).padStart(2, '0') }

function formatDisplay(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function DateTimePicker({ value, onChange, maxNow = false, placeholder = 'Selecionar data e hora…' }: Props) {
  const now = new Date()
  const initial = parseISO(value) ?? now

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())
  const [selected, setSelected] = useState<Date | null>(parseISO(value))
  const [hour, setHour] = useState(pad(initial.getHours()))
  const [minute, setMinute] = useState(pad(initial.getMinutes()))
  const modalRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  function openPicker() {
    const d = parseISO(value) ?? new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setSelected(parseISO(value))
    setHour(pad(d.getHours()))
    setMinute(pad(d.getMinutes()))
    setOpen(true)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function selectDay(day: number) {
    setSelected(new Date(viewYear, viewMonth, day, parseInt(hour) || 0, parseInt(minute) || 0))
  }

  function confirm() {
    if (!selected) return
    const d = new Date(selected)
    d.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0)
    onChange(d.toISOString())
    close()
  }

  function clear() {
    setSelected(null)
    onChange('')
    close()
  }

  function isDisabled(day: number) {
    if (!maxNow) return false
    return new Date(viewYear, viewMonth, day, 23, 59) > now
  }

  function isSelected(day: number) {
    return !!selected && selected.getDate() === day &&
      selected.getMonth() === viewMonth && selected.getFullYear() === viewYear
  }

  function isToday(day: number) {
    return now.getDate() === day && now.getMonth() === viewMonth && now.getFullYear() === viewYear
  }

  const timeInputStyle: React.CSSProperties = {
    width: 58, padding: '8px 10px', font: 'inherit',
    fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500,
    background: 'var(--bg)', border: '1px solid var(--line)',
    borderRadius: 2, textAlign: 'center', color: 'var(--ink)', outline: 'none',
  }

  const navBtnStyle: React.CSSProperties = {
    background: 'none', border: '1px solid var(--line)', borderRadius: 2,
    width: 30, height: 30, display: 'grid', placeItems: 'center',
    cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1,
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        style={{
          width: '100%', padding: '10px 12px', font: 'inherit', fontSize: 13.5,
          color: value ? 'var(--ink)' : 'var(--muted)',
          background: 'var(--bg)', border: '1px solid var(--line)',
          borderRadius: 2, cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}
      >
        <span>{value && selected ? formatDisplay(selected) : placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--muted)', flexShrink: 0 }}>
          <rect x="2" y="3" width="12" height="12" rx="1" />
          <path d="M5 1v4M11 1v4M2 7h12" />
        </svg>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Modal */}
          <div
            ref={modalRef}
            style={{
              position: 'fixed', zIndex: 9999,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 2,
              boxShadow: '0 20px 60px rgba(0,0,0,.18)',
              padding: 24,
              width: 320,
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>
                Selecionar data e hora
              </span>
              <button type="button" onClick={close}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>
                ✕
              </button>
            </div>

            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button type="button" style={navBtnStyle} onClick={prevMonth}>‹</button>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink)' }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" style={navBtnStyle} onClick={nextMonth}>›</button>
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', paddingBottom: 6, fontWeight: 500 }}>
                  {d}
                </div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const disabled = isDisabled(day)
                const sel = isSelected(day)
                const today = isToday(day)
                return (
                  <button key={i} type="button" disabled={disabled} onClick={() => selectDay(day)}
                    style={{
                      height: 34, borderRadius: 2, border: 'none',
                      fontSize: 13, fontFamily: 'var(--font-mono)',
                      cursor: disabled ? 'default' : 'pointer',
                      background: sel ? 'var(--ink)' : today ? 'var(--panel-alt)' : 'none',
                      color: disabled ? 'var(--muted-2)' : sel ? 'var(--bg)' : today ? 'var(--ink)' : 'var(--ink-2)',
                      fontWeight: sel || today ? 500 : 400,
                      outline: today && !sel ? '1px solid var(--line)' : 'none',
                    }}>
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Time picker */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: 10 }}>
                Horário
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <input
                  style={timeInputStyle}
                  value={hour}
                  maxLength={2}
                  placeholder="00"
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setHour(v)
                    if (selected) { const d = new Date(selected); d.setHours(parseInt(v) || 0); setSelected(d) }
                  }}
                  onBlur={() => setHour(pad(Math.min(23, parseInt(hour) || 0)))}
                />
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 300 }}>:</span>
                <input
                  style={timeInputStyle}
                  value={minute}
                  maxLength={2}
                  placeholder="00"
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setMinute(v)
                    if (selected) { const d = new Date(selected); d.setMinutes(parseInt(v) || 0); setSelected(d) }
                  }}
                  onBlur={() => setMinute(pad(Math.min(59, parseInt(minute) || 0)))}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button type="button" className="btn primary" onClick={confirm} disabled={!selected} style={{ flex: 1 }}>
                Confirmar
              </button>
              <button type="button" className="btn ghost" onClick={clear}>
                Limpar
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
