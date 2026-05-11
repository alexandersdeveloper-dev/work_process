export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import EnsinoClient from './EnsinoClient'
import type { Ensino } from '@/types'

export default async function EnsinoPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }

  const { data } = await supabase
    .from('ensino')
    .select('*, author:profiles!ensino_author_id_fkey(id, full_name, cargo)')
    .order('created_at', { ascending: false })

  const role = (profile as { role: string } | null)?.role ?? 'servidor'
  const canManage = role === 'admin' || role === 'chefe'

  return <EnsinoClient items={(data as unknown as Ensino[]) ?? []} canManage={canManage} />
}
