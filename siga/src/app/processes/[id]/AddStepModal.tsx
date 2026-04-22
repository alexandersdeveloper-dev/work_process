'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import AddStepForm from './AddStepForm'

export default function AddStepModal({ processId }: { processId: string }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        + Adicionar etapa
      </button>

      {mounted && open && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'modal-bg-in 0.18s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
              animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Adicionar etapa</h3>
              <button
                onClick={close}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4,
                }}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <AddStepForm processId={processId} onSuccess={close} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
