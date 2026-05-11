'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useShell } from './ShellProvider'
import { useUser } from '@/lib/user-context'
import { ROLE_LABELS } from '@/lib/auth-guard'
import type { UserRole } from '@/types'

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, closeSidebar, collapsed, toggleCollapsed } = useShell()
  const { profile } = useUser()
  const role = profile?.role

  function active(href: string) {
    const exact = href === '/' || href === '/unidade'
    return exact ? pathname === href : pathname.startsWith(href)
  }

  function item(href: string, label: string, icon: React.ReactNode) {
    return (
      <Link href={href} onClick={closeSidebar} title={collapsed ? label : undefined}>
        <div className={`sb-item${active(href) ? ' active' : ''}`}>
          {icon}
          <span>{label}</span>
        </div>
      </Link>
    )
  }

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-mark">WP</div>
          <div className="sb-brand-text">
            <div className="t1">Work Process</div>
            <div className="t2">Gestão de processos</div>
          </div>
          <button
            className="sb-toggle"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir menu' : 'Retrair menu'}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed
                ? <path d="M6 3l5 5-5 5" />
                : <path d="M10 3L5 8l5 5" />
              }
            </svg>
          </button>
        </div>

        <nav className="sb-nav">
          {/* Botão expandir — só visível quando colapsado, alinhado com os ícones */}
          <button
            className="sb-nav-toggle"
            onClick={toggleCollapsed}
            title="Expandir menu"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>

          <div>
            <div className="sb-group-label">Principal</div>
            {item('/', 'Dashboard', <HomeIcon />)}
            {item('/processes', 'Meus Processos', <LayersIcon />)}
            {(role === 'servidor' || role === 'assistente') && item('/compartilhados', 'Compartilhados', <ShareIcon />)}
            {item('/comunicados', 'Comunicado Institucional', <MegaphoneIcon />)}
            {item('/calendario', 'Calendário', <CalendarIcon />)}
            {item('/ensino', 'Ensino', <GraduationIcon />)}
          </div>

          {(role === 'chefe' || role === 'admin') && (
            <div style={{ marginTop: 16 }}>
              <div className="sb-group-label">Unidade</div>
              {item('/unidade', 'Dashboard da Unidade', <BuildingIcon />)}
              {item('/unidade/processos', 'Processos da Unidade', <LayersIcon />)}
            </div>
          )}

          {role === 'admin' && (
            <div style={{ marginTop: 16 }}>
              <div className="sb-group-label">Administração</div>
              {item('/admin', 'Painel Admin', <ShieldIcon />)}
              {item('/admin/usuarios', 'Usuários', <UsersIcon />)}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-avatar" title={collapsed ? (profile?.full_name ?? '') : undefined}>
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="who">
            <div className="n">{profile?.full_name || 'Usuário'}</div>
            <div className="r" style={{ textTransform: 'capitalize' }}>
              {profile?.cargo || ROLE_LABELS[role as UserRole] || 'Servidor'}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function HomeIcon() {
  return (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 6.5L8 2l6 4.5V14H10v-3H6v3H2V6.5z" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1.5L14 5l-6 3.5L2 5l6-3.5z" />
      <path d="M2 8.5l6 3.5 6-3.5" />
      <path d="M2 11.5l6 3.5 6-3.5" />
    </svg>
  )
}

function MegaphoneIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="12" rx="1" />
      <path d="M5 1v4M11 1v4M2 7h12" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M9 3v18M15 3v18M3 9h6M3 15h6M15 9h6M15 15h6" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  )
}

function GraduationIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
      <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
    </svg>
  )
}
