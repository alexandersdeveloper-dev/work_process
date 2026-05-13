import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { Profile } from '@/types'

/** Retorna todos os profiles não-admin, com cache de 5 min compartilhado entre componentes. */
export function useProfiles() {
  const supabase = createClient()
  return useQuery({
    queryKey: queryKeys.profiles(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('full_name')
      if (error) throw error
      return (data ?? []) as Profile[]
    },
    staleTime: 5 * 60 * 1000,
  })
}
