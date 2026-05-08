export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { STATUS_LABELS, STATUS_KIND, getProcessTypeLabel } from '@/types'
import type { Process, Profile } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function UnidadeDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const [processesRes, profilesRes] = await Promise.all([
    supabase
      .from('processes')
      .select('*, owner:profiles!owner_id(id, full_name)')
      .order('updated_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .neq('role', 'admin')
      .order('full_name'),
  ])

  const all = (processesRes.data as (Process & { owner: Pick<Profile, 'id' | 'full_name'> | null })[]) ?? []
  const profiles = (profilesRes.data as Pick<Profile, 'id' | 'full_name' | 'role'>[]) ?? []

  const stats = {
    total: all.length,
    active: all.filter((p) => p.status === 'active').length,
    in_progress: all.filter((p) => p.status === 'in_progress').length,
    delayed: all.filter((p) => p.status === 'delayed').length,
  }

  const recent = all.slice(0, 8)

  const byUser = profiles.map((profile) => ({
    ...profile,
    count: all.filter((p) => p.owner_id === profile.id).length,
  })).filter((u) => u.count > 0).sort((a, b) => b.count - a.count)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard da Unidade</h1>
          <p className="sub">Visão geral de todos os processos da secretaria</p>
        </div>
        <Link href="/unidade/processos">
          <button className="btn ghost">Ver todos os processos</button>
        </Link>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Total</div>
          <div className="val">{stats.total}</div>
          <div className="hint">processos na unidade</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <div className="card-h">
            <h3>Processos recentes</h3>
            <Link href="/unidade/processos" className="btn ghost sm">Ver todos</Link>
          </div>
          <div className="table-wrap">
            {recent.length === 0 ? (
              <div className="empty"><p>Nenhum processo cadastrado.</p></div>
            ) : (
              <table className="t">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Responsável por</th>
                    <th>Status</th>
                    <th>Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id}>
                      <td className="bold">
                        <Link href={`/processes/${p.id}`}>{p.title}</Link>
                      </td>
                      <td className="muted">{p.owner?.full_name ?? '—'}</td>
                      <td>
                        <span className={`pill ${STATUS_KIND[p.status]}`}>
                          <span className="d" />{STATUS_LABELS[p.status]}
                        </span>
                      </td>
                      <td className="muted">{p.deadline ? formatDate(p.deadline) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {byUser.length > 0 && (
          <div className="card" style={{ minWidth: 220 }}>
            <div className="card-h"><h3>Por servidor</h3></div>
            <div style={{ padding: '0 20px 16px' }}>
              {byUser.map((u) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)', gap: 24 }}>
                  <span style={{ fontSize: 13 }}>{u.full_name}</span>
                  <span className="pill info" style={{ fontVariantNumeric: 'tabular-nums' }}>{u.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
