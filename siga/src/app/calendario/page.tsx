import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CalendarioClient from './CalendarioClient'

export type ProcessDeadline = import('@/types').ProcessDeadline

export default async function CalendarioPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <CalendarioClient />
}
