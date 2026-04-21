export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_KIND, getProcessTypeLabel, PRIORITY_LABELS, PRIORITY_KIND } from '@/types'
import type { Process, Step } from '@/types'
import StepTimeline from './StepTimeline'
import AddStepForm from './AddStepForm'
import DeleteProcessButton from './DeleteProcessButton'

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
          <Link href={`/processes/${process.id}/edit`}>
            <button className="btn">Editar</button>
          </Link>
          <DeleteProcessButton id={process.id} />
        </div>
      </div>

      <div className="detail-grid">
        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="card">
            <div className="card-h"><h3>Informações</h3></div>
            <div className="card-b">
              {process.description && (
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.6 }}>
                  {process.description}
                </p>
              )}
              <div className="field">
                <span className="k">Tipo</span>
                <span className="v">{getProcessTypeLabel(process.type)}</span>
              </div>
              <div className="field">
                <span className="k">Responsável</span>
                <span className="v">{process.responsible}</span>
              </div>
              {process.portal_section && (
                <div className="field">
                  <span className="k">Seção do portal</span>
                  <span className="v">{process.portal_section}</span>
                </div>
              )}
              <div className="field">
                <span className="k">Prazo</span>
                <span className="v">{process.deadline ? formatDate(process.deadline) : '—'}</span>
              </div>
              <div className="field">
                <span className="k">Criado em</span>
                <span className="v mono">{formatDate(process.created_at)}</span>
              </div>
              <div className="field">
                <span className="k">Atualizado</span>
                <span className="v mono">{formatDate(process.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <h3>Adicionar etapa</h3>
              <span className="sub">Registre o próximo passo desta trilha</span>
            </div>
            <div className="card-b">
              <AddStepForm processId={process.id} />
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div>
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
      </div>
    </>
  )
}
