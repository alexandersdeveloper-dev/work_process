'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DeleteProcessButton({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!confirming) return
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setConfirming(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [confirming])

  async function handleDelete() {
    setLoading(true)
    const { error: err } = await supabase.from('processes').delete().eq('id', id)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/processes')
    router.refresh()
  }

  return (
    <>
      {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
      <button className="btn danger-btn" onClick={() => setConfirming(true)}>
        Excluir
      </button>

      {mounted && confirming && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'modal-bg-in 0.18s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !loading) setConfirming(false) }}
        >
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
          }}>
            <div style={{ padding: '24px 24px 8px' }}>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Excluir processo</p>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                Esta ação não pode ser desfeita. O processo e todas as suas etapas serão removidos permanentemente.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px 24px' }}>
              <button
                className="btn ghost"
                onClick={() => setConfirming(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="btn danger-btn"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Excluindo…' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
