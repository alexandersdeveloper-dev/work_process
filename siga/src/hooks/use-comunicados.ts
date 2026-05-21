import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { Comunicado } from '@/types'

export const COMUNICADO_LIMIT = 100

async function fetchComunicados(userId: string, role: string): Promise<Comunicado[]> {
  const supabase = createClient()
  const isPrivileged = role === 'admin' || role === 'chefe'

  let query = supabase
    .from('comunicados')
    .select('*, author:profiles!comunicados_author_id_fkey(id, full_name, role)')
    .order('created_at', { ascending: false })
    .limit(COMUNICADO_LIMIT)

  if (!isPrivileged) {
    query = query.or(`target_user_ids.is.null,target_user_ids.cs.{${userId}}`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as Comunicado[]) ?? []
}

export function useComunicados(userId: string, role: string, initialData?: Comunicado[]) {
  return useQuery({
    queryKey: queryKeys.comunicados(userId, role),
    queryFn: () => fetchComunicados(userId, role),
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!userId && !!role,
    placeholderData: keepPreviousData,
  })
}
