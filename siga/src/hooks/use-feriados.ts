import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { queryKeys } from '@/lib/query-keys'
import type { Feriado } from '@/types'

async function fetchFeriados(): Promise<Feriado[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feriados')
    .select('*')
    .order('active', { ascending: false })
    .order('recurrence', { ascending: false })
    .order('month', { ascending: true, nullsFirst: false })
    .order('date', { ascending: true, nullsFirst: false })
    .order('name')
  if (error) throw error
  return (data ?? []) as Feriado[]
}

/** Feriados com cache de 1 min e suporte a initialData do SSR. */
export function useFeriados(initialData?: Feriado[]) {
  return useQuery({
    queryKey: queryKeys.feriados(),
    queryFn: fetchFeriados,
    initialData,
    staleTime: 60 * 1000,
  })
}

/** Mutation: toggle active com optimistic update. */
export function useToggleFeriadoActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await fetch(`/api/admin/feriados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar feriado.')
    },
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feriados() })
      const prev = queryClient.getQueryData<Feriado[]>(queryKeys.feriados())
      queryClient.setQueryData<Feriado[]>(queryKeys.feriados(), (old) =>
        old?.map((f) => (f.id === id ? { ...f, active } : f)) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.feriados(), ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.feriados() }),
  })
}

/** Mutation: delete com optimistic update. */
export function useDeleteFeriado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/feriados/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir feriado.')
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feriados() })
      const prev = queryClient.getQueryData<Feriado[]>(queryKeys.feriados())
      queryClient.setQueryData<Feriado[]>(queryKeys.feriados(), (old) =>
        old?.filter((f) => f.id !== id) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKeys.feriados(), ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.feriados() }),
  })
}

/** Mutation: criar feriado. */
export function useCreateFeriado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/admin/feriados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Erro ao criar feriado.')
      }
      return res.json() as Promise<{ id: string }>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.feriados() }),
  })
}

/** Mutation: editar feriado. */
export function useUpdateFeriado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/feriados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Erro ao atualizar feriado.')
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.feriados() }),
  })
}
