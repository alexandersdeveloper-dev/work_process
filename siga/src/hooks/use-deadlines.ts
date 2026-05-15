import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { ProcessDeadline } from '@/types'

async function fetchDeadlines(userId: string, role: string): Promise<ProcessDeadline[]> {
  const supabase = createClient()

  let sharedIds: string[] = []
  if (role === 'servidor') {
    const { data: shared } = await supabase
      .from('process_shares')
      .select('process_id')
      .eq('shared_with_user_id', userId)
    sharedIds = (shared ?? []).map((s: { process_id: string }) => s.process_id)
  }

  let query = supabase
    .from('processes')
    .select('id, title, type, status, priority, deadline')
    .not('deadline', 'is', null)
    .not('status', 'in', '("done","cancelled","completed")')

  if (role === 'servidor') {
    const filters = [
      `owner_id.eq.${userId}`,
      ...(sharedIds.length > 0 ? [`id.in.(${sharedIds.join(',')})`] : []),
    ]
    query = query.or(filters.join(','))
  }

  const { data, error } = await query.order('deadline', { ascending: true })
  if (error) throw error
  return (data as ProcessDeadline[]) ?? []
}

export function useDeadlines(userId: string, role: string) {
  return useQuery({
    queryKey: queryKeys.deadlines(userId, role),
    queryFn: () => fetchDeadlines(userId, role),
    staleTime: 2 * 60 * 1000,
    enabled: !!userId && !!role,
    placeholderData: keepPreviousData,
  })
}
