'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useShell } from './ShellProvider'

export default function Topbar() {
  const pathname = usePathname()
  const { theme, toggleTheme, toggleSidebar } = useShell()

  const isDetail = pathname.match(/^\/processes\/[^/]+$/) && !pathname.endsWith('/new')
  const isEdit = pathname.endsWith('/edit')

  let crumbs: { label: string; href?: string }[] = [{ label: 'Work Process' }]
  if (pathname === '/') crumbs.push({ label: 'Dashboard' })
  else if (pathname === '/processes') crumbs.push({ label: 'Processos' })
  else if (pathname === '/processes/new') {
    crumbs.push({ label: 'Processos', href: '/processes' })
    crumbs.push({ label: 'Novo processo' })
  } else if (isDetail) {
    crumbs.push({ label: 'Processos', href: '/processes' })
    crumbs.push({ label: 'Detalhe' })
  } else if (isEdit) {
    crumbs.push({ label: 'Processos', href: '/processes' })
    crumbs.push({ label: 'Editar' })
  }

  return (
    <header className="topbar">
      {/* Hamburger — mobile only */}
      <button className="iconbtn hamburger" onClick={toggleSidebar} aria-label="Abrir menu">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
        </svg>
      </button>

      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span className="sep">/</span>}
            {c.href ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className="spacer" />

      <div className="search">
        <svg className="ico" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5L14 14" strokeLinecap="round" />
        </svg>
        <input placeholder="Buscar processos…" />
      </div>

      {/* Dark mode toggle */}
      <button className="iconbtn" onClick={toggleTheme} aria-label="Alternar tema" title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
        {theme === 'dark' ? (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="3.5" />
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13.5 10A6 6 0 016 2.5a6 6 0 100 11 6 6 0 007.5-3.5z" />
          </svg>
        )}
      </button>
    </header>
  )
}
