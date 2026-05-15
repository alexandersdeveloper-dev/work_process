'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastCtx {
  showToast: (message: string, type?: ToastType) => void
}

const Ctx = createContext<ToastCtx>({ showToast: () => {} })

export function useToast() { return useContext(Ctx) }

function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 300,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          padding: '10px 16px',
          borderRadius: 6,
          background: t.type === 'error' ? 'var(--danger)' : 'var(--ink)',
          color: 'var(--bg)',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
          animation: 'toast-in 0.2s cubic-bezier(.34,1.56,.64,1) both',
          maxWidth: 340,
          lineHeight: 1.4,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>
            {t.type === 'error' ? '✗' : '✓'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = String(++counterRef.current)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, type === 'error' ? 4000 : 2500)
  }, [])

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </Ctx.Provider>
  )
}
