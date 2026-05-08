export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import CalendarioClient from './CalendarioClient'
import type { Folga } from '@/types'

async function getFolgas(): Promise<Folga[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('folgas')
    .select('id, user_id, date, end_date, type, description, registered_by, created_at, profile:profiles!folgas_user_id_fkey(id, full_name, cargo)')
    .order('date', { ascending: true })
  return (data as unknown as Folga[]) ?? []
}

export default async function CalendarioPage() {
  const folgas = await getFolgas()
  return <CalendarioClient folgas={folgas} />
}
