import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'

export interface CustomTypeRow {
  id: string
  label: string
  created_at: string
}

async function fetchTypes(table: string, userId: string): Promise<CustomTypeRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(table)
    .select('id, label, created_at')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as CustomTypeRow[]
}

export function useProcessTypes(userId: string, initialData?: CustomTypeRow[]) {
  return useQuery({
    queryKey: queryKeys.processTypes(userId),
    queryFn: () => fetchTypes('user_process_types', userId),
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
    placeholderData: keepPreviousData,
  })
}

export function useStepTypes(userId: string, initialData?: CustomTypeRow[]) {
  return useQuery({
    queryKey: queryKeys.stepTypes(userId),
    queryFn: () => fetchTypes('user_step_types', userId),
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
    placeholderData: keepPreviousData,
  })
}

export function useInvalidateCustomTypes() {
  const queryClient = useQueryClient()
  return (userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.processTypes(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.stepTypes(userId) })
  }
}
