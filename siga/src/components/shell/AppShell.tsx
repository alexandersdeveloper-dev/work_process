'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useShell } from './ShellProvider'
import { PageTransition } from './PageTransition'
import { NavigationProgress } from './NavigationProgress'
import GlobalSearch from '@/components/search/GlobalSearch'
import ShortcutsModal from '@/components/ui/ShortcutsModal'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, searchOpen, openSearch, closeSearch } = useShell()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      const editing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement).isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openSearch()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        router.push('/processes/new')
        return
      }
      if (e.key === '?' && !editing) {
        setShortcutsOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openSearch, router])

  if (pathname === '/login' || pathname === '/mudar-senha') {
    return <>{children}</>
  }

  return (
    <>
      <NavigationProgress />
      <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Sidebar />
        <div className="main">
          <Topbar />
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onClose={closeSearch} />
      <ShortcutsModal open={shortcutsOpen} onClose={closeShortcuts} />
    </>
  )
}
