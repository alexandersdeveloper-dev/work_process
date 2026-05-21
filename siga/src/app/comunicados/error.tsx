'use client'

import { useEffect } from 'react'
import ErrorCard from '@/components/ui/ErrorCard'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ComunicadosError({ error, reset }: Props) {
  useEffect(() => { console.error('[Comunicados]', error) }, [error])
  return <ErrorCard message="Não foi possível carregar os comunicados." onRetry={reset} />
}
