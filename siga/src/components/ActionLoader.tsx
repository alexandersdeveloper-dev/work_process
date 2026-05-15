'use client'
import { useActionLoader } from '@/contexts/ActionLoaderContext'

export default function ActionLoader() {
  const { isLoading } = useActionLoader()
  return (
    <div
      aria-live="polite"
      aria-busy={isLoading}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: isLoading ? 1 : 0,
        transition: 'opacity 200ms ease',
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--accent)',
            animation: 'action-loader-slide 1.4s ease-in-out infinite',
          }}
        />
      )}
    </div>
  )
}
