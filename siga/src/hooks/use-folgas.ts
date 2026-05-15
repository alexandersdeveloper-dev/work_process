import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { Folga } from '@/types'

async function fetchFolgas(userId: string, role: string): Promise<Folga[]> {
  const supabase = createClient()
  let query = supabase
    .from('folgas')
    .select('id, user_id, date, end_date, type, description, registered_by, created_at, profile:profiles!folgas_user_id_fkey(id, full_name, cargo)')
    .order('date', { ascending: true })
  if (role === 'servidor') query = query.eq('user_id', userId)
  const { data, error } = await query
  if (error) throw error
  return (data as unknown as Folga[]) ?? []
}

export function useFolgas(userId: string, role: string) {
  return useQuery({
    queryKey: queryKeys.folgas(userId, role),
    queryFn: () => fetchFolgas(userId, role),
    staleTime: 2 * 60 * 1000,
    enabled: !!userId && !!role,
    placeholderData: keepPreviousData,
  })
}

/** Invalida o cache de folgas para forçar revalidação após mutations. */
export function useInvalidateFolgas() {
  const queryClient = useQueryClient()
  return (userId: string, role: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.folgas(userId, role) })
}
