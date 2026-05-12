export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import TiposClient, { TypeRow } from './TiposClient'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function TiposPage() {
  const admin = serviceClient()

  const [
    { data: processTypes },
    { data: stepTypes },
    { data: profiles },
  ] = await Promise.all([
    admin.from('user_process_types').select('id, user_id, label, created_at').order('user_id').order('created_at'),
    admin.from('user_step_types').select('id, user_id, label, created_at').order('user_id').order('created_at'),
    admin.from('profiles').select('id, full_name').neq('role', 'admin').order('full_name'),
  ])

  const nameMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name ?? 'Sem nome']))

  function enrich(rows: { id: string; user_id: string; label: string; created_at: string }[] | null): TypeRow[] {
    return (rows ?? []).map((r) => ({ ...r, user_name: nameMap.get(r.user_id) ?? 'Usuário desconhecido' }))
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tipos de Usuário</h1>
          <p className="sub">Tipos personalizados de processo e etapa criados pelos servidores</p>
        </div>
      </div>
      <TiposClient
        processTypes={enrich(processTypes)}
        stepTypes={enrich(stepTypes)}
        users={(profiles ?? []).map((p: { id: string; full_name: string | null }) => ({ id: p.id, full_name: p.full_name }))}
      />
    </>
  )
}
