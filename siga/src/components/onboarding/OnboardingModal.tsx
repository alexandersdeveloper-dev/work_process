'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'

const ROLE_CONFIG = {
  chefe: {
    greeting: 'Bem-vindo, Chefe!',
    description: 'Gerencie sua equipe, acompanhe processos e publique comunicados.',
    actions: [
      { label: 'Ver todos os processos', href: '/unidade/processos', icon: '📋' },
      { label: 'Publicar comunicado', href: '/comunicados', icon: '📢' },
      { label: 'Gerenciar calendário', href: '/calendario', icon: '📅' },
    ],
  },
  admin: {
    greeting: 'Bem-vindo, Administrador!',
    description: 'Gerencie usuários, tipos e configurações do sistema.',
    actions: [
      { label: 'Gerenciar usuários', href: '/admin/usuarios', icon: '👥' },
      { label: 'Ver processos da unidade', href: '/unidade/processos', icon: '📋' },
      { label: 'Configurações', href: '/configuracoes', icon: '⚙️' },
    ],
  },
  servidor: {
    greeting: 'Bem-vindo ao SIGA!',
    description: 'Organize seus processos de trabalho e acompanhe prazos com facilidade.',
    actions: [
      { label: 'Criar primeiro processo', href: '/processes/new', icon: '➕' },
      { label: 'Ver comunicados', href: '/comunicados', icon: '📢' },
      { label: 'Abrir Kanban', href: '/kanban', icon: '🗂️' },
    ],
  },
}

export default function OnboardingModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const modalRef = useFocusTrap(open && mounted)
  const [loading, setLoading] = useState(false)
  const { profile } = useUser()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  const role = (profile?.role ?? 'servidor') as keyof typeof ROLE_CONFIG
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.servidor

  async function dismiss() {
    setLoading(true)
    await supabase.from('profiles').update({ onboarding_done: true }).eq('id', userId)
    setOpen(false)
  }

  async function goTo(href: string) {
    setLoading(true)
    await supabase.from('profiles').update({ onboarding_done: true }).eq('id', userId)
    setOpen(false)
    router.push(href)
  }

  if (!mounted || !open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'modal-bg-in 0.2s ease both',
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 32px 64px rgba(0,0,0,0.2)',
          animation: 'modal-panel-in 0.25s cubic-bezier(.34,1.56,.64,1) both',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid var(--line)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--accent)', color: 'var(--bg)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 14px',
            fontSize: 22,
          }}>✦</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>{config.greeting}</h2>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0, lineHeight: 1.55 }}>{config.description}</p>
        </div>

        {/* Action cards */}
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>
            Por onde começar
          </p>
          {config.actions.map((a) => (
            <button
              key={a.href}
              disabled={loading}
              onClick={() => goTo(a.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: 'var(--panel-alt)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13.5, fontWeight: 500,
                color: 'var(--ink)',
                textAlign: 'left',
                transition: 'border-color 0.12s, background 0.12s',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{a.icon}</span>
              <span>{a.label}</span>
              <svg style={{ marginLeft: 'auto', color: 'var(--muted)', flexShrink: 0 }} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 28px 24px', textAlign: 'center' }}>
          <button
            className="btn ghost sm"
            disabled={loading}
            onClick={dismiss}
            style={{ color: 'var(--muted)', fontSize: 13 }}
          >
            Explorar por conta própria
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
