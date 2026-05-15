'use client'
import { createContext, useContext, useCallback, useRef, useState } from 'react'

interface ActionLoaderContextValue {
  isLoading: boolean
  message: string | undefined
  showLoader: (msg?: string) => void
  hideLoader: () => void
}

const ActionLoaderContext = createContext<ActionLoaderContextValue | null>(null)

export function ActionLoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const counterRef = useRef(0)

  const showLoader = useCallback((msg?: string) => {
    counterRef.current += 1
    setIsLoading(true)
    if (msg) setMessage(msg)
  }, [])

  const hideLoader = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1)
    if (counterRef.current === 0) {
      setIsLoading(false)
      setMessage(undefined)
    }
  }, [])

  return (
    <ActionLoaderContext.Provider value={{ isLoading, message, showLoader, hideLoader }}>
      {children}
    </ActionLoaderContext.Provider>
  )
}

export function useActionLoader() {
  const ctx = useContext(ActionLoaderContext)
  if (!ctx) throw new Error('useActionLoader must be used within ActionLoaderProvider')
  return ctx
}
