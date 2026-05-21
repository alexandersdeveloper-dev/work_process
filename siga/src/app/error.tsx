'use client'

import { useEffect } from 'react'
import ErrorCard from '@/components/ui/ErrorCard'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Global Error Boundary]', error)
  }, [error])

  return (
    <ErrorCard
      message="Ocorreu um erro inesperado. Tente novamente ou recarregue a página."
      onRetry={reset}
    />
  )
}
