'use client'

import { useRef, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove('page-enter')
    requestAnimationFrame(() => el.classList.add('page-enter'))
  }, [pathname])

  return (
    <div ref={ref} className="content page-enter">
      {children}
    </div>
  )
}
