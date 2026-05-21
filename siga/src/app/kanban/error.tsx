'use client'

import { useEffect } from 'react'
import ErrorCard from '@/components/ui/ErrorCard'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function KanbanError({ error, reset }: Props) {
  useEffect(() => { console.error('[Kanban]', error) }, [error])
  return <ErrorCard message="Não foi possível carregar o Kanban." onRetry={reset} />
}
