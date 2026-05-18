'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevPath = useRef(pathname)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      if (!href.startsWith('/') || anchor.getAttribute('target') === '_blank') return
      const dest = href.split('?')[0].split('#')[0]
      if (dest === prevPath.current) return

      clearTimeout(timer.current)
      setVisible(true)
      setWidth(8)
      // Crawl slowly toward 75% — stops well short so "done" jump is visible
      timer.current = setTimeout(() => setWidth(75), 30)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    if (pathname === prevPath.current) return
    prevPath.current = pathname

    // Navigation complete: rush to 100%, then fade out
    clearTimeout(timer.current)
    setWidth(100)
    timer.current = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 320)
  }, [pathname])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 3,
      zIndex: 9999, pointerEvents: 'none',
    }}>
      <div style={{
        height: '100%',
        width: `${width}%`,
        background: 'var(--accent)',
        transition: width === 100
          ? 'width 0.2s ease'
          : width === 8
            ? 'none'
            : 'width 1.8s cubic-bezier(0.05, 0.8, 0.1, 1)',
        boxShadow: '0 0 8px var(--accent)',
      }} />
    </div>
  )
}
