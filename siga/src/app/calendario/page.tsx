export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import CalendarioClient from './CalendarioClient'
import type { Folga } from '@/types'

async function getFolgas(): Promise<Folga[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('folgas')
    .select('*, profile:profiles!folgas_user_id_fkey(*)')
    .order('date', { ascending: true })
  return (data as Folga[]) ?? []
}

export default async function CalendarioPage() {
  const folgas = await getFolgas()
  return <CalendarioClient folgas={folgas} />
}
