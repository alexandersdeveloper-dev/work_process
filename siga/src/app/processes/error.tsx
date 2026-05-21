'use client'

import { useEffect } from 'react'
import ErrorCard from '@/components/ui/ErrorCard'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProcessesError({ error, reset }: Props) {
  useEffect(() => { console.error('[Processes]', error) }, [error])
  return <ErrorCard message="Não foi possível carregar os processos." onRetry={reset} />
}
