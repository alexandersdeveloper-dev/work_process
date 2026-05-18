export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ConfiguracoesClient from './ConfiguracoesClient'
import type { CustomTypeRow } from '@/hooks/use-custom-types'

export default async function ConfiguracoesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: processTypes }, { data: stepTypes }] = await Promise.all([
    supabase.from('user_process_types').select('id, label, created_at').eq('user_id', user.id).order('created_at'),
    supabase.from('user_step_types').select('id, label, created_at').eq('user_id', user.id).order('created_at'),
  ])

  return (
    <ConfiguracoesClient
      initialProcessTypes={(processTypes as CustomTypeRow[]) ?? []}
      initialStepTypes={(stepTypes as CustomTypeRow[]) ?? []}
    />
  )
}
