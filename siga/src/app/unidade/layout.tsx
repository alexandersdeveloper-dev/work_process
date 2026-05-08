import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'

export default async function UnidadeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as Pick<Profile, 'role'> | null)?.role === 'servidor') redirect('/')
  return <>{children}</>
}
