export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import ComunicadoForm from '../../ComunicadoForm'
import type { Comunicado } from '@/types'

export default async function EditComunicadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: comunicado } = await supabase.from('comunicados').select('*').eq('id', id).single()

  if (!comunicado) notFound()

  const canEdit = profile?.role === 'admin' || comunicado.author_id === user.id
  if (!canEdit) redirect('/comunicados')

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Editar comunicado</h1>
          <p className="sub">{comunicado.title}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-b">
          <ComunicadoForm comunicado={comunicado as Comunicado} />
        </div>
      </div>
    </>
  )
}
