export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ComunicadosClient from './ComunicadosClient'
import type { Comunicado } from '@/types'

export default async function ComunicadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profileData as { role: string } | null)?.role ?? 'servidor'
  const isPrivileged = role === 'admin' || role === 'chefe'

  let query = supabase
    .from('comunicados')
    .select('*, author:profiles!comunicados_author_id_fkey(*)')
    .order('created_at', { ascending: false })

  if (!isPrivileged) {
    query = query.or(`target_user_ids.is.null,target_user_ids.cs.{${user.id}}`)
  }

  const { data } = await query

  return (
    <ComunicadosClient
      initialComunicados={(data as Comunicado[]) ?? []}
      initialRole={role}
    />
  )
}
