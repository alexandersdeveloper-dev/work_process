export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_KIND, getProcessTypeLabel } from '@/types'
import type { Process } from '@/types'
import DeadlineNotifier from './DeadlineNotifier'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  // 2 queries total instead of 4: get shared ids, then fetch all processes once
  const { data: shared } = await supabase
    .from('process_shares')
    .select('process_id')
    .eq('shared_with_user_id', uid)

  const sharedIds = (shared ?? []).map((s: { process_id: string }) => s.process_id)
  const filters = [`owner_id.eq.${uid}`, ...(sharedIds.length > 0 ? [`id.in.(${sharedIds.join(',')})`] : [])]

  const { data } = await supabase
    .from('processes')
    .select('id, title, type, status, priority, responsible, deadline, updated_at, owner_id')
    .or(filters.join(','))
    .order('updated_at', { ascending: false })

  const all = (data ?? []) as Process[]

  const stats = {
    total: all.length,
    active: all.filter((p) => p.status === 'active').length,
    in_progress: all.filter((p) => p.status === 'in_progress').length,
    delayed: all.filter((p) => p.status === 'delayed').length,
  }

  const recent = all.slice(0, 8)

  return (
    <>
      {uid && <DeadlineNotifier userId={uid} />}

      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="sub">Seus processos de trabalho</p>
        </div>
        <Link href="/processes/new">
          <button className="btn primary">+ Novo processo</button>
        </Link>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Total</div>
          <div className="val">{stats.total}</div>
          <div className="hint">processos cadastrados</div>
        </div>
        <div className="kpi">
          <div className="label">Ativos</div>
          <div className="val">{stats.active}</div>
          <div className="hint">aguardando início</div>
        </div>
        <div className="kpi">
          <div className="label">Em andamento</div>
          <div className="val">{stats.in_progress}</div>
          <div className="hint">em execução agora</div>
        </div>
        <div className="kpi">
          <div className="label">Atrasados</div>
          <div className="val" style={{ color: stats.delayed > 0 ? 'var(--danger)' : undefined }}>
            {stats.delayed}
          </div>
          <div className="hint">precisam de atenção</div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Processos recentes</h3>
          <Link href="/processes" className="btn ghost sm">Ver todos</Link>
        </div>
        <div className="table-wrap">
          {recent.length === 0 ? (
            <div className="empty">
              <p>Nenhum processo cadastrado ainda.</p>
              <Link href="/processes/new">
                <button className="btn primary" style={{ marginTop: 16 }}>Criar primeiro processo</button>
              </Link>
            </div>
          ) : (
            <table className="t">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td className="bold">
                      <Link href={`/processes/${p.id}`}>{p.title}</Link>
                    </td>
                    <td className="muted">{getProcessTypeLabel(p.type)}</td>
                    <td>
                      <span className={`pill ${STATUS_KIND[p.status]}`}>
                        <span className="d" />
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="muted">{p.responsible}</td>
                    <td className="muted">{p.deadline ? formatDate(p.deadline) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
