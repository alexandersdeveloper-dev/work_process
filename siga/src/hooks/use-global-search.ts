import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'

export interface SearchResult {
  id: string
  title: string
  subtitle: string
  category: 'process' | 'comunicado' | 'kanban'
  href: string
}

async function runSearch(q: string): Promise<SearchResult[]> {
  const supabase = createClient()
  const pattern = `%${q}%`

  const [processes, comunicados, kanban] = await Promise.all([
    supabase
      .from('processes')
      .select('id, title, status, responsible')
      .ilike('title', pattern)
      .limit(5),
    supabase
      .from('comunicados')
      .select('id, title, type')
      .ilike('title', pattern)
      .limit(5),
    supabase
      .from('kanban_cards')
      .select('id, title, column_key')
      .ilike('title', pattern)
      .limit(5),
  ])

  const STATUS_PT: Record<string, string> = {
    active: 'Ativo', in_progress: 'Em andamento', delayed: 'Atrasado',
    completed: 'Concluído', cancelled: 'Cancelado',
  }
  const COL_PT: Record<string, string> = {
    todo: 'A Fazer', doing: 'Em Andamento', review: 'Em Revisão', done: 'Concluído',
  }

  const results: SearchResult[] = []

  for (const p of processes.data ?? []) {
    results.push({
      id: p.id,
      title: p.title,
      subtitle: `${STATUS_PT[p.status] ?? p.status} · ${p.responsible}`,
      category: 'process',
      href: `/processes/${p.id}`,
    })
  }
  for (const c of comunicados.data ?? []) {
    results.push({
      id: c.id,
      title: c.title,
      subtitle: c.type,
      category: 'comunicado',
      href: '/comunicados',
    })
  }
  for (const k of kanban.data ?? []) {
    results.push({
      id: k.id,
      title: k.title,
      subtitle: COL_PT[k.column_key] ?? k.column_key,
      category: 'kanban',
      href: '/kanban',
    })
  }

  return results
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => runSearch(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  })
}
