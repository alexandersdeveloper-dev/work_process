'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useGlobalSearch } from '@/hooks/use-global-search'
import type { SearchResult } from '@/hooks/use-global-search'

const CATEGORY_LABELS: Record<string, string> = {
  process: 'Processos',
  comunicado: 'Comunicados',
  kanban: 'Kanban',
}

function CategoryIcon({ cat }: { cat: string }) {
  if (cat === 'process') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M5 6h6M5 9h4" />
    </svg>
  )
  if (cat === 'comunicado') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M14 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3l3 3 3-3h3a1 1 0 001-1V3a1 1 0 00-1-1z" />
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="3" height="14" rx="1" />
      <rect x="6" y="1" width="3" height="10" rx="1" />
      <rect x="11" y="1" width="3" height="12" rx="1" />
    </svg>
  )
}

interface Props { open: boolean; onClose: () => void }

export default function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setDebouncedQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(t)
  }, [query])

  const { data: results = [], isFetching } = useGlobalSearch(debouncedQuery)

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    ;(acc[r.category] ??= []).push(r)
    return acc
  }, {})

  const flat = results

  const navigate = useCallback((result: SearchResult) => {
    onClose()
    router.push(result.href)
  }, [onClose, router])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && flat[cursor]) navigate(flat[cursor])
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, cursor, flat, navigate, onClose])

  if (!mounted || !open) return null

  const showEmpty = debouncedQuery.length >= 2 && !isFetching && results.length === 0
  const showHint = debouncedQuery.length < 2

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '80px 24px 24px',
        animation: 'modal-bg-in 0.15s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          animation: 'modal-panel-in 0.2s cubic-bezier(.34,1.56,.64,1) both',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          borderBottom: '1px solid var(--line)',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0) }}
            placeholder="Buscar processos, comunicados, kanban…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--ink)',
              fontSize: 15, fontFamily: 'inherit',
            }}
          />
          {isFetching && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.5"
              style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" strokeDasharray="20" strokeDashoffset="8" />
            </svg>
          )}
          <kbd style={{
            fontSize: 11, color: 'var(--muted)', background: 'var(--panel-alt)',
            border: '1px solid var(--line)', borderRadius: 4, padding: '1px 5px',
            fontFamily: 'var(--font-mono)', flexShrink: 0,
          }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {showHint && (
            <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
              Digite ao menos 2 caracteres para buscar
            </div>
          )}
          {showEmpty && (
            <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
              Nenhum resultado para <strong style={{ color: 'var(--ink)' }}>"{debouncedQuery}"</strong>
            </div>
          )}
          {(['process', 'comunicado', 'kanban'] as const).map((cat) => {
            const items = grouped[cat]
            if (!items?.length) return null
            const globalOffset = flat.findIndex((r) => r.id === items[0].id)
            return (
              <div key={cat}>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: 10.5, fontWeight: 700,
                  color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: 'var(--panel-alt)',
                  borderTop: '1px solid var(--line)',
                }}>
                  {CATEGORY_LABELS[cat]}
                </div>
                {items.map((r, i) => {
                  const idx = globalOffset + i
                  const active = idx === cursor
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigate(r)}
                      onMouseEnter={() => setCursor(idx)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', textAlign: 'left',
                        background: active ? 'var(--accent-soft)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid var(--line)',
                        color: 'var(--ink)',
                      }}
                    >
                      <span style={{ color: active ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }}>
                        <CategoryIcon cat={cat} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.title}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted)', display: 'block' }}>
                          {r.subtitle}
                        </span>
                      </span>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px', borderTop: '1px solid var(--line)',
          display: 'flex', gap: 12, alignItems: 'center',
          background: 'var(--panel-alt)',
        }}>
          {[['↑↓', 'navegar'], ['↵', 'abrir'], ['Esc', 'fechar']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
              <kbd style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 3, padding: '1px 4px', fontFamily: 'var(--font-mono)', fontSize: 10 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
