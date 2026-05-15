import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProcessesClient from '@/app/processes/ProcessesClient'

export default async function UnidadeProcessosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <ProcessesClient
      mode="unit"
      title="Processos da Unidade"
      subtitle="Todos os processos de trabalho da secretaria"
    />
  )
}
