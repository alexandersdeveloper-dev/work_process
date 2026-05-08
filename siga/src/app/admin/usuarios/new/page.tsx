export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NewUserForm from '../NewUserForm'
import type { Profile } from '@/types'

export default async function NewUserPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as Pick<Profile, 'role'> | null)?.role !== 'admin') redirect('/admin')

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Novo usuário</h1>
          <p className="sub">Criar conta de acesso ao SIGA</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-b">
          <NewUserForm />
        </div>
      </div>
    </>
  )
}
