export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import EditUserForm from './EditUserForm'
import type { Profile } from '@/types'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Editar usuário</h1>
          <p className="sub">{(data as Profile).full_name || 'Sem nome'}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-b">
          <EditUserForm profile={data as Profile} />
        </div>
      </div>
    </>
  )
}
