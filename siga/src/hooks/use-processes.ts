import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { Process } from '@/types'

const PROCESS_SELECT = 'id, title, type, priority, status, responsible, deadline, description, portal_section, created_at, updated_at, owner_id'

async function fetchOwnProcesses(userId: string): Promise<Process[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('processes')
    .select(PROCESS_SELECT)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Process[]
}

async function fetchSharedProcesses(userId: string): Promise<Process[]> {
  const supabase = createClient()
  const { data: shares } = await supabase
    .from('process_shares')
    .select('process_id')
    .eq('shared_with_user_id', userId)

  const ids = (shares ?? []).map((s: { process_id: string }) => s.process_id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('processes')
    .select(PROCESS_SELECT)
    .in('id', ids)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Process[]
}

export function useProcesses(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.processes(userId, 'own'),
    queryFn: () => fetchOwnProcesses(userId),
    staleTime: 2 * 60 * 1000,
    enabled: !!userId && enabled,
    placeholderData: keepPreviousData,
  })
}

export function useSharedProcesses(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.sharedProcesses(userId),
    queryFn: () => fetchSharedProcesses(userId),
    staleTime: 2 * 60 * 1000,
    enabled: !!userId && enabled,
    placeholderData: keepPreviousData,
  })
}

async function fetchAllProcesses(): Promise<Process[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('processes')
    .select(PROCESS_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Process[]
}

export function useAllProcesses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.allProcesses(),
    queryFn: fetchAllProcesses,
    staleTime: 2 * 60 * 1000,
    enabled,
    placeholderData: keepPreviousData,
  })
}
