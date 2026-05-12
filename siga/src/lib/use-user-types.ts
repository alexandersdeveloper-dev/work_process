import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'

type Table = 'user_process_types' | 'user_step_types'

// Cache em memória por sessão — evita refetch quando componentes remontam
const cache = new Map<string, string[]>()

export function useUserTypes(table: Table) {
  const { user } = useUser()
  const cacheKey = user ? `${user.id}:${table}` : null

  const [customTypes, setCustomTypes] = useState<string[]>(() =>
    cacheKey ? (cache.get(cacheKey) ?? []) : []
  )

  useEffect(() => {
    if (!user || !cacheKey) return
    if (cache.has(cacheKey)) {
      setCustomTypes(cache.get(cacheKey)!)
      return
    }
    async function load() {
      const { data } = await supabase
        .from(table)
        .select('label')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
      const labels = data?.map((r: { label: string }) => r.label) ?? []
      cache.set(cacheKey!, labels)
      setCustomTypes(labels)
    }
    load()
  }, [user, table, cacheKey])

  function addType(label: string) {
    if (!cacheKey) return
    const updated = [...(cache.get(cacheKey) ?? []), label]
    cache.set(cacheKey, updated)
    setCustomTypes(updated)
  }

  function updateType(oldLabel: string, newLabel: string) {
    if (!cacheKey) return
    const updated = (cache.get(cacheKey) ?? []).map(l => l === oldLabel ? newLabel : l)
    cache.set(cacheKey, updated)
    setCustomTypes(updated)
  }

  function removeType(label: string) {
    if (!cacheKey) return
    const updated = (cache.get(cacheKey) ?? []).filter(l => l !== label)
    cache.set(cacheKey, updated)
    setCustomTypes(updated)
  }

  return { customTypes, addType, updateType, removeType }
}
