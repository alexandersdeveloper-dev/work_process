import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ComunicadosClient from './ComunicadosClient'

export default async function ComunicadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <ComunicadosClient />
}
