export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProcessForm from '../../ProcessForm'

export default async function EditProcessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: process } = await supabase.from('processes').select('*').eq('id', id).single()
  if (!process) notFound()

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Editar processo</h1>
          <p className="sub">{process.title}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-b">
          <ProcessForm process={process} />
        </div>
      </div>
    </>
  )
}
