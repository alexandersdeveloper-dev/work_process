import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProcessesClient from '@/app/processes/ProcessesClient'

export default async function CompartilhadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <ProcessesClient
      mode="shared"
      title="Compartilhados"
      subtitle="Processos que outros usuários compartilharam com você"
    />
  )
}
