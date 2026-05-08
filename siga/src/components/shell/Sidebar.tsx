'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useShell } from './ShellProvider'
import { useUser } from '@/lib/user-context'

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, closeSidebar } = useShell()
  const { profile } = useUser()
  const role = profile?.role

  function active(href: string) {
    const exact = href === '/' || href === '/unidade'
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sb-brand">
          <div className="sb-mark">WP</div>
          <div className="sb-brand-text">
            <div className="t1">Work Process</div>
            <div className="t2">Gestão de processos</div>
          </div>
        </div>

        <nav className="sb-nav">
          <div>
            <div className="sb-group-label">Principal</div>

            <Link href="/" onClick={closeSidebar}>
              <div className={`sb-item${active('/') ? ' active' : ''}`}>
                <HomeIcon />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link href="/processes" onClick={closeSidebar}>
              <div className={`sb-item${active('/processes') ? ' active' : ''}`}>
                <LayersIcon />
                <span>Meus Processos</span>
              </div>
            </Link>

            {role === 'servidor' && (
              <Link href="/compartilhados" onClick={closeSidebar}>
                <div className={`sb-item${active('/compartilhados') ? ' active' : ''}`}>
                  <ShareIcon />
                  <span>Compartilhados</span>
                </div>
              </Link>
            )}

            <Link href="/comunicados" onClick={closeSidebar}>
              <div className={`sb-item${active('/comunicados') ? ' active' : ''}`}>
                <MegaphoneIcon />
                <span>Comunicado Institucional</span>
              </div>
            </Link>

            <Link href="/calendario" onClick={closeSidebar}>
              <div className={`sb-item${active('/calendario') ? ' active' : ''}`}>
                <CalendarIcon />
                <span>Calendário</span>
              </div>
            </Link>
          </div>

          {(role === 'chefe' || role === 'admin') && (
            <div style={{ marginTop: 16 }}>
              <div className="sb-group-label">Unidade</div>
              <Link href="/unidade" onClick={closeSidebar}>
                <div className={`sb-item${active('/unidade') ? ' active' : ''}`}>
                  <BuildingIcon />
                  <span>Dashboard da Unidade</span>
                </div>
              </Link>
              <Link href="/unidade/processos" onClick={closeSidebar}>
                <div className={`sb-item${active('/unidade/processos') ? ' active' : ''}`}>
                  <LayersIcon />
                  <span>Processos da Unidade</span>
                </div>
              </Link>
            </div>
          )}

          {role === 'admin' && (
            <div style={{ marginTop: 16 }}>
              <div className="sb-group-label">Administração</div>
              <Link href="/admin" onClick={closeSidebar}>
                <div className={`sb-item${active('/admin') ? ' active' : ''}`}>
                  <ShieldIcon />
                  <span>Painel Admin</span>
                </div>
              </Link>
              <Link href="/admin/usuarios" onClick={closeSidebar}>
                <div className={`sb-item${active('/admin/usuarios') ? ' active' : ''}`}>
                  <UsersIcon />
                  <span>Usuários</span>
                </div>
              </Link>
            </div>
          )}
        </nav>

        <div className="sb-footer">
          <div className="sb-avatar">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="who">
            <div className="n">{profile?.full_name || 'Usuário'}</div>
            <div className="r" style={{ textTransform: 'capitalize' }}>
              {role === 'admin' ? 'Administrador' : role === 'chefe' ? 'Chefe' : 'Servidor'}
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
