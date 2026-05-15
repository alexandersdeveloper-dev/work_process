export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_KIND, getProcessTypeLabel, PRIORITY_LABELS, PRIORITY_KIND } from '@/types'
import type { Process, Step, ProcessShare } from '@/types'
import StepTimeline from './StepTimeline'
import AddStepModal from './AddStepModal'
import DeleteProcessButton from './DeleteProcessButton'
import CollapsibleInfo from './CollapsibleInfo'
import ShareModal from './ShareModal'

async function getProcess(id: string): Promise<Process | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('processes')
    .select('id, title, description, type, status, priority, responsible, portal_section, deadline, created_at, updated_at, owner_id')
    .eq('id', id)
    .single()
  return data
}

async function getSteps(processId: string, stepIds?: string[]): Promise<Step[]> {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('steps')
    .select('id, title, description, step_type, performed_by, reference_link, created_at, updated_at, mark_state, process_id')
    .eq('process_id', processId)
    .order('created_at', { ascending: true })
  if (stepIds && stepIds.length > 0) query = query.in('id', stepIds)
  const { data } = await query
  return data ?? []
}

async function getShares(processId: string): Promise<ProcessShare[]> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('process_shares')
    .select('id, process_id, shared_with_user_id, shared_by_user_id, step_ids, created_at, profile:profiles!process_shares_shared_with_user_id_fkey(full_name)')
    .eq('process_id', processId)
  return (data as unknown as ProcessShare[]) ?? []
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }

  const [process, shares] = await Promise.all([getProcess(id), getShares(id)])

  if (!process) notFound()

  const role = profile?.role ?? 'servidor'
  const canShare = role === 'admin' || role === 'chefe' || process.owner_id === user?.id
  const canSeeAllSteps = canShare

  const myShare = canSeeAllSteps ? null : shares.find((s) => s.shared_with_user_id === user?.id)
  const steps = await getSteps(id, myShare?.step_ids ?? undefined)
  const stepsFiltered = !!myShare?.step_ids?.length

  const fields = [
    { label: 'Tipo',         value: getProcessTypeLabel(process.type) },
    { label: 'Responsável',  value: process.responsible },
    ...(process.portal_section ? [{ label: 'Seção do portal', value: process.portal_section }] : []),
    { label: 'Prazo',        value: process.deadline ? formatDate(process.deadline) : '—' },
    { label: 'Criado em',    value: formatDate(process.created_at), mono: true },
    { label: 'Atualizado',   value: formatDate(process.updated_at), mono: true },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className={`pill ${STATUS_KIND[process.status]}`}>
              <span className="d" />
              {STATUS_LABELS[process.status]}
            </span>
            <span className={`pill ${PRIORITY_KIND[process.priority]}`}>
              {PRIORITY_LABELS[process.priority]}
            </span>
          </div>
          <h1>{process.title}</h1>
          <p className="sub">{getProcessTypeLabel(process.type)} · Responsável: {process.responsible}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canShare && (
            <ShareModal
              processId={process.id}
              processOwnerId={process.owner_id}
              existingShares={shares}
            />
          )}
          <AddStepModal processId={process.id} />
          <Link href={`/processes/${process.id}/edit`}>
            <button className="btn">Editar</button>
          </Link>
          <DeleteProcessButton id={process.id} />
        </div>
      </div>

      {shares.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Compartilhado com:</span>
          {shares.map((s) => (
            <span key={s.id} style={{
              fontSize: 12, background: 'var(--panel-alt)', border: '1px solid var(--line)',
              borderRadius: 20, padding: '2px 10px', color: 'var(--ink-2)',
            }}>
              {s.profile?.full_name ?? '—'}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <CollapsibleInfo description={process.description} fields={fields} />

        <StepTimeline
          processId={process.id}
          initialSteps={steps}
          stepIds={myShare?.step_ids ?? null}
          stepsFiltered={stepsFiltered}
          canShare={canShare}
        />
      </div>
    </>
  )
}
