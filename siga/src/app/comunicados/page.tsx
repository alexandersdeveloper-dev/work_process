export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import ComunicadosClient from './ComunicadosClient'
import type { Comunicado } from '@/types'

async function getComunicados(): Promise<Comunicado[]> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isPrivileged = profile?.role === 'admin' || profile?.role === 'chefe'

  let query = supabase
    .from('comunicados')
    .select('*, author:profiles!comunicados_author_id_fkey(*)')
    .order('created_at', { ascending: false })

  if (!isPrivileged) {
    query = query.or(`target_user_ids.is.null,target_user_ids.cs.{${user.id}}`)
  }

  const { data } = await query
  return (data as Comunicado[]) ?? []
}

export default async function ComunicadosPage() {
  const comunicados = await getComunicados()
  return <ComunicadosClient comunicados={comunicados} />
}
