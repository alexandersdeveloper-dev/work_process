'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  STATUS_LABELS, STATUS_KIND,
  getProcessTypeLabel, PRIORITY_LABELS, PRIORITY_KIND,
} from '@/types'
import type { Process } from '@/types'

const LS_KEY = 'siga_process_view'
const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'delayed', label: 'Atrasados' },
  { key: 'completed', label: 'Concluídos' },
]

type View = 'list' | 'cards'
type Counts = Record<string, number>

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ---------- List view ---------- */
function ListView({ processes }: { processes: Process[] }) {
  const router = useRouter()
  if (processes.length === 0) {
    return <div className="empty"><p>Nenhum processo nesta categoria.</p></div>
  }
  return (
    <div className="table-wrap">
      <table className="t">
        <thead>
          <tr>
            <th>Título</th>
            <th>Tipo</th>
            <th>Prioridade</th>
            <th>Status</th>
            <th>Responsável</th>
            <th>Prazo</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => (
            <tr key={p.id} onClick={() => router.push(`/processes/${p.id}`)} style={{ cursor: 'pointer' }}>
              <td className="bold">{p.title}</td>
              <td className="muted">{getProcessTypeLabel(p.type)}</td>
              <td><span className={`pill ${PRIORITY_KIND[p.priority]}`}>{PRIORITY_LABELS[p.priority]}</span></td>
              <td>
                <span className={`pill ${STATUS_KIND[p.status]}`}>
                  <span className="d" />{STATUS_LABELS[p.status]}
                </span>
              </td>
              <td className="muted">{p.responsible}</td>
              <td className="muted">{p.deadline ? formatDate(p.deadline) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Cards view ---------- */
function CardsView({ processes }: { processes: Process[] }) {
  if (processes.length === 0) {
    return <div className="empty" style={{ padding: '40px 24px' }}><p>Nenhum processo nesta categoria.</p></div>
  }
  return (
    <div className="process-cards">
      {processes.map((p) => (
        <Link key={p.id} href={`/processes/${p.id}`} className="process-card">
          {/* Header: status + priority */}
          <div className="pc-header">
            <span className={`pill ${STATUS_KIND[p.status]}`}>
              <span className="d" />{STATUS_LABELS[p.status]}
            </span>
            <span className={`pill ${PRIORITY_KIND[p.priority]}`}>
              {PRIORITY_LABELS[p.priority]}
            </span>
          </div>

          {/* Title + type */}
          <div className="pc-body">
            <div className="pc-title">{p.title}</div>
            <div className="pc-type">{getProcessTypeLabel(p.type)}</div>
            {p.description && (
              <div className="pc-desc">{p.description}</div>
            )}
          </div>

          {/* Footer: responsible + deadline */}
          <div className="pc-footer">
            <div className="pc-meta">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="6" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              </svg>
              <span>{p.responsible}</span>
            </div>
            {p.deadline && (
              <div className="pc-meta">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="12" height="12" rx="1" /><path d="M5 1v4M11 1v4M2 7h12" />
                </svg>
                <span>{formatDateLong(p.deadline)}</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

/* ---------- Main component ---------- */
export default function ProcessesClient({
  processes,
  counts,
  activeTab,
}: {
  processes: Process[]
  counts: Counts
  activeTab: string
}) {
  const router = useRouter()
  const [view, setView] = useState<View>('list')

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as View | null
    if (saved) setView(saved)
  }, [])

  function toggleView(v: View) {
    setView(v)
    localStorage.setItem(LS_KEY, v)
  }

  return (
    <>
      {/* Page head */}
      <div className="page-head">
        <div>
          <h1>Processos</h1>
          <p className="sub">Todos os processos de trabalho da equipe</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle — desktop only */}
          <div className="view-toggle">
            <button
              className={`view-toggle-btn${view === 'list' ? ' active' : ''}`}
              onClick={() => toggleView('list')}
              title="Visualização em lista"
              aria-label="Lista"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className={`view-toggle-btn${view === 'cards' ? ' active' : ''}`}
              onClick={() => toggleView('cards')}
              title="Visualização em cards"
              aria-label="Cards"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="6" height="6" rx="1" />
                <rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" />
                <rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
          </div>

          <Link href="/processes/new">
            <button className="btn primary">+ Novo processo</button>
          </Link>
        </div>
      </div>

      {/* Content card */}
      <div className="card">
        {/* Tabs */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => router.push(`/processes?status=${tab.key}`)}
            >
              {tab.label}
              <span className="c">{counts[tab.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* View */}
        {view === 'list'
          ? <ListView processes={processes} />
          : <CardsView processes={processes} />
        }

        <div className="pagination">
          <span>{processes.length} processo{processes.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </>
  )
}
