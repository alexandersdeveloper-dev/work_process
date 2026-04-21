'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface ShellCtx {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

const Ctx = createContext<ShellCtx>({} as ShellCtx)

export function useShell() { return useContext(Ctx) }

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('siga_theme') as 'light' | 'dark' | null
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initial = saved ?? preferred
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('siga_theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <Ctx.Provider value={{ theme, toggleTheme, sidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </Ctx.Provider>
  )
}
