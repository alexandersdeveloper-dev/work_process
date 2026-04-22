export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_KIND, getProcessTypeLabel, PRIORITY_LABELS, PRIORITY_KIND } from '@/types'
import type { Process, Step } from '@/types'
import StepTimeline from './StepTimeline'
import AddStepModal from './AddStepModal'
import DeleteProcessButton from './DeleteProcessButton'
import CollapsibleInfo from './CollapsibleInfo'

async function getProcess(id: string): Promise<Process | null> {
  const { data } = await supabase.from('processes').select('*').eq('id', id).single()
  return data
}

async function getSteps(processId: string): Promise<Step[]> {
  const { data } = await supabase
    .from('steps')
    .select('*')
    .eq('process_id', processId)
    .order('created_at', { ascending: true })
  return data ?? []
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [process, steps] = await Promise.all([getProcess(id), getSteps(id)])

  if (!process) notFound()

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
        <div style={{ display: 'flex', gap: 8 }}>
          <AddStepModal processId={process.id} />
          <Link href={`/processes/${process.id}/edit`}>
            <button className="btn">Editar</button>
          </Link>
          <DeleteProcessButton id={process.id} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <CollapsibleInfo description={process.description} fields={fields} />

        <div className="card">
          <div className="card-h">
            <h3>Trilha de execução</h3>
            <span className="sub">{steps.length} etapa{steps.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="card-b">
            <StepTimeline steps={steps} />
          </div>
        </div>
      </div>
    </>
  )
}
