'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useShell } from './ShellProvider'

const nav = [
  {
    group: 'Principal',
    items: [
      { href: '/', label: 'Dashboard', icon: HomeIcon },
      { href: '/processes', label: 'Processos', icon: LayersIcon },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, closeSidebar } = useShell()

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sb-brand">
          <div className="sb-mark">WP</div>
          <div className="sb-brand-text">
            <div className="t1">Work Process</div>
            <div className="t2">Gestão de processos</div>
          </div>
        </div>

        <nav className="sb-nav">
          {nav.map((group) => (
            <div key={group.group}>
              <div className="sb-group-label">{group.group}</div>
              {group.items.map((item) => {
                const active = item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href} onClick={closeSidebar}>
                    <div className={`sb-item${active ? ' active' : ''}`}>
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="sb-avatar">EU</div>
          <div className="who">
            <div className="n">Minha equipe</div>
            <div className="r">Work Process</div>
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
