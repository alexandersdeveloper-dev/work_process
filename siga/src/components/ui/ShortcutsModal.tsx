'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/use-focus-trap'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl'

const SHORTCUTS = [
  { group: 'Navegação', items: [
    { keys: [mod, 'K'], label: 'Abrir busca global' },
    { keys: [mod, 'N'], label: 'Novo processo' },
    { keys: ['?'],      label: 'Ver atalhos' },
  ]},
  { group: 'Geral', items: [
    { keys: ['Esc'],    label: 'Fechar modal / painel' },
    { keys: ['↑', '↓'], label: 'Navegar em resultados' },
    { keys: ['↵'],      label: 'Confirmar / abrir' },
  ]},
]

interface Props { open: boolean; onClose: () => void }

export default function ShortcutsModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const modalRef = useFocusTrap(open && mounted)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'modal-bg-in 0.15s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 10, width: '100%', maxWidth: 420,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          animation: 'modal-panel-in 0.2s cubic-bezier(.34,1.56,.64,1) both',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--line)',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Atalhos de teclado</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, padding: 2 }}>✕</button>
        </div>
        <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SHORTCUTS.map((g) => (
            <div key={g.group}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                {g.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {g.items.map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--line)',
                  }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{item.label}</span>
                    <span style={{ display: 'flex', gap: 3 }}>
                      {item.keys.map((k) => (
                        <kbd key={k} style={{
                          background: 'var(--panel-alt)', border: '1px solid var(--line)',
                          borderRadius: 4, padding: '2px 6px',
                          fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink)',
                        }}>{k}</kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
