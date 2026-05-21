'use client'

import { useEffect } from 'react'
import ErrorCard from '@/components/ui/ErrorCard'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CalendarioError({ error, reset }: Props) {
  useEffect(() => { console.error('[Calendario]', error) }, [error])
  return <ErrorCard message="Não foi possível carregar o calendário." onRetry={reset} />
}
