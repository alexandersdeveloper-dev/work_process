export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_KIND, getProcessTypeLabel } from '@/types'
import type { Process } from '@/types'
import DeadlineNotifier from './DeadlineNotifier'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function deadlineKind(iso: string | null | undefined): 'overdue' | 'soon' | null {
  if (!iso) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  if (d < today) return 'overdue'
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 7 ? 'soon' : null
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

      {/* Banner de alerta — processos atrasados */}
      {stats.delayed > 0 && (
        <div className="dash-alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="dash-alert-msg">
            {stats.delayed} processo{stats.delayed !== 1 ? 's' : ''} atrasado{stats.delayed !== 1 ? 's' : ''}{' '}
            {stats.delayed !== 1 ? 'precisam' : 'precisa'} de atenção
          </span>
          <Link href="/processes" className="btn ghost sm">Ver processos →</Link>
        </div>
      )}

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </div>
          <div className="label">Total</div>
          <div className="val">{stats.total}</div>
          <div className="hint">processos cadastrados</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
          <div className="label">Ativos</div>
          <div className="val">{stats.active}</div>
          <div className="hint">aguardando início</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div className="label">Em andamento</div>
          <div className="val">{stats.in_progress}</div>
          <div className="hint">em execução agora</div>
        </div>
        <div className="kpi">
          <div className="kpi-icon" style={stats.delayed > 0 ? { background: 'rgba(153,27,27,.08)', color: 'var(--danger)' } : {}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
            </svg>
          </div>
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

        {/* Desktop: tabela */}
        <div className="dash-table">
          {recent.length === 0 ? (
            <div className="empty">
              <p>Nenhum processo cadastrado ainda.</p>
              <Link href="/processes/new">
                <button className="btn primary" style={{ marginTop: 16 }}>Criar primeiro processo</button>
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
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
                      <td className="muted" suppressHydrationWarning>{p.deadline ? formatDate(p.deadline) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile: lista de cards */}
        <div className="dash-cards">
          {recent.length === 0 ? (
            <div className="empty" style={{ padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <p style={{ margin: 0 }}>Nenhum processo cadastrado ainda.</p>
              <Link href="/processes/new">
                <button className="btn primary">Criar primeiro processo</button>
              </Link>
            </div>
          ) : (
            recent.map((p) => {
              const dk = deadlineKind(p.deadline)
              return (
                <Link key={p.id} href={`/processes/${p.id}`} className="dash-proc-item">
                  <div className="dash-proc-main">
                    <span className="dash-proc-title">{p.title}</span>
                    <span className="dash-proc-meta">{p.responsible}</span>
                  </div>
                  <div className="dash-proc-side">
                    <span className={`pill ${STATUS_KIND[p.status]}`} style={{ fontSize: 11 }}>
                      <span className="d" />{STATUS_LABELS[p.status]}
                    </span>
                    {p.deadline && (
                      <span className={`dash-proc-date${dk === 'overdue' ? ' danger' : dk === 'soon' ? ' warning' : ''}`} suppressHydrationWarning>
                        {formatDateShort(p.deadline)}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
