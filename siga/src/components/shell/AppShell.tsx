'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useShell } from './ShellProvider'
import { PageTransition } from './PageTransition'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { collapsed } = useShell()

  if (pathname === '/login' || pathname === '/mudar-senha') {
    return <>{children}</>
  }

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar />
      <div className="main">
        <Topbar />
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </div>
  )
}
