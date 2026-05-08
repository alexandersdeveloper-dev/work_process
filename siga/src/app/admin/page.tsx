export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  const [
    { count: totalProcesses },
    { count: totalUsers },
    { count: totalComunicados },
    { count: totalFolgas },
  ] = await Promise.all([
    supabase.from('processes').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('comunicados').select('*', { count: 'exact', head: true }),
    supabase.from('folgas').select('*', { count: 'exact', head: true }),
  ])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Painel Admin</h1>
          <p className="sub">Visão global do sistema</p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Processos</div>
          <div className="val">{totalProcesses ?? 0}</div>
          <div className="hint">no sistema</div>
        </div>
        <div className="kpi">
          <div className="label">Usuários</div>
          <div className="val">{totalUsers ?? 0}</div>
          <div className="hint">cadastrados</div>
        </div>
        <div className="kpi">
          <div className="label">Comunicados</div>
          <div className="val">{totalComunicados ?? 0}</div>
          <div className="hint">publicados</div>
        </div>
        <div className="kpi">
          <div className="label">Folgas</div>
          <div className="val">{totalFolgas ?? 0}</div>
          <div className="hint">registradas</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginTop: 8 }}>
        <Link href="/admin/usuarios" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: 24, cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent-soft)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                  <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/><path d="M21 21v-2a4 4 0 0 0-3-3.85" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Usuários</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Gerenciar perfis e papéis</div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/processes" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: 24, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent-soft)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                  <path d="M8 1.5L14 5l-6 3.5L2 5l6-3.5z"/><path d="M2 8.5l6 3.5 6-3.5"/><path d="M2 11.5l6 3.5 6-3.5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Todos os processos</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Visão global de processos</div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/comunicados" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: 24, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent-soft)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Comunicados</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Publicar e gerir comunicados</div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/calendario" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ padding: 24, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--accent-soft)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                  <rect x="2" y="3" width="12" height="12" rx="1"/><path d="M5 1v4M11 1v4M2 7h12"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Calendário de folgas</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Visão global de folgas</div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </>
  )
}
