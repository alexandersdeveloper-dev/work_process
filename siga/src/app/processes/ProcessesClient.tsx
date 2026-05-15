'use client'

import { useState, useMemo, useLayoutEffect, useTransition, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  STATUS_LABELS, STATUS_KIND,
  getProcessTypeLabel, PRIORITY_LABELS, PRIORITY_KIND,
} from '@/types'
import type { Process } from '@/types'
import { useUser } from '@/lib/user-context'
import { useProcesses, useSharedProcesses, useAllProcesses } from '@/hooks/use-processes'

const LS_KEY = 'siga_process_view'
const LS_SORT_KEY = 'siga_process_sort'

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'delayed', label: 'Atrasados' },
  { key: 'completed', label: 'Concluídos' },
]

const SORT_OPTIONS = [
  { key: 'default', label: 'Padrão' },
  { key: 'deadline', label: 'Prazo (mais próximo)' },
  { key: 'priority', label: 'Prioridade' },
  { key: 'status', label: 'Status' },
  { key: 'title', label: 'Título (A→Z)' },
]

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER: Record<string, number> = { delayed: 0, in_progress: 1, active: 2, completed: 3 }

type View = 'list' | 'cards'
type SortKey = 'default' | 'deadline' | 'priority' | 'status' | 'title'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
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

/* ---------- Skeleton ---------- */
function ProcessesSkeleton({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
        </div>
      </div>
      <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            height: 44, borderRadius: 4,
            background: 'var(--panel-alt)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }} />
        ))}
      </div>
    </>
  )
}

/* ---------- Empty state ---------- */
function EmptyState({ search, tab, isShared }: { search: string; tab: string; isShared: boolean }) {
  if (search) {
    return (
      <div className="empty" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <p style={{ margin: 0 }}>
          Nenhum resultado para <strong>"{search}"</strong>
        </p>
      </div>
    )
  }
  if (tab !== 'all') {
    return (
      <div className="empty" style={{ padding: '48px 24px' }}>
        <p>Nenhum processo nesta categoria.</p>
      </div>
    )
  }
  if (isShared) {
    return (
      <div className="empty" style={{ padding: '48px 24px' }}>
        <p>Nenhum processo foi compartilhado com você ainda.</p>
      </div>
    )
  }
  return (
    <div className="empty" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.3">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
      <p style={{ margin: 0 }}>Nenhum processo cadastrado ainda.</p>
      <Link href="/processes/new">
        <button className="btn primary" style={{ marginTop: 4 }}>+ Novo processo</button>
      </Link>
    </div>
  )
}

/* ---------- List view ---------- */
function ListView({ processes, search, tab, isShared }: { processes: Process[]; search: string; tab: string; isShared: boolean }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  if (processes.length === 0) return <EmptyState search={search} tab={tab} isShared={isShared} />

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
          {processes.map((p) => {
            const dk = deadlineKind(p.deadline)
            return (
              <tr key={p.id} onClick={() => startTransition(() => router.push(`/processes/${p.id}`))} style={{ cursor: 'pointer' }}>
                <td className="bold">{p.title}</td>
                <td className="muted">{getProcessTypeLabel(p.type)}</td>
                <td><span className={`pill ${PRIORITY_KIND[p.priority]}`}>{PRIORITY_LABELS[p.priority]}</span></td>
                <td>
                  <span className={`pill ${STATUS_KIND[p.status]}`}>
                    <span className="d" />{STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="muted">{p.responsible}</td>
                <td suppressHydrationWarning>
                  {p.deadline
                    ? <span className={`pill${dk === 'overdue' ? ' danger' : dk === 'soon' ? ' warning' : ''}`}
                        style={!dk ? { background: 'transparent', padding: '0', color: 'var(--muted)', fontWeight: 400, fontSize: 13, border: 'none', boxShadow: 'none' } : {}}>
                        {formatDate(p.deadline)}
                      </span>
                    : <span className="muted">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Cards view ---------- */
function CardsView({ processes, search, tab, isShared }: { processes: Process[]; search: string; tab: string; isShared: boolean }) {
  if (processes.length === 0) return <EmptyState search={search} tab={tab} isShared={isShared} />

  return (
    <div className="process-cards">
      {processes.map((p) => {
        const dk = deadlineKind(p.deadline)
        return (
          <Link key={p.id} href={`/processes/${p.id}`} className="process-card">
            <div className="pc-header">
              <span className={`pill ${STATUS_KIND[p.status]}`}>
                <span className="d" />{STATUS_LABELS[p.status]}
              </span>
              <span className={`pill ${PRIORITY_KIND[p.priority]}`}>
                {PRIORITY_LABELS[p.priority]}
              </span>
            </div>
            <div className="pc-body">
              <div className="pc-title">{p.title}</div>
              <div className="pc-type">{getProcessTypeLabel(p.type)}</div>
              {p.description && <div className="pc-desc">{p.description}</div>}
            </div>
            <div className="pc-footer">
              <div className="pc-meta">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="6" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                </svg>
                <span>{p.responsible}</span>
              </div>
              {p.deadline && (
                <div className="pc-meta" style={dk === 'overdue' ? { color: 'var(--danger)' } : dk === 'soon' ? { color: 'var(--warning)' } : {}}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="12" height="12" rx="1" /><path d="M5 1v4M11 1v4M2 7h12" />
                  </svg>
                  <span suppressHydrationWarning>{formatDateLong(p.deadline)}</span>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ---------- Main component ---------- */
export default function ProcessesClient({
  mode = 'own',
  title = 'Meus Processos',
  subtitle = 'Seus processos de trabalho',
}: {
  mode?: 'own' | 'shared' | 'unit'
  title?: string
  subtitle?: string
}) {
  const { user } = useUser()
  const userId = user?.id ?? ''

  const isOwn = mode === 'own'
  const isUnit = mode === 'unit'
  const ownQuery = useProcesses(userId, isOwn)
  const sharedQuery = useSharedProcesses(userId, mode === 'shared')
  const unitQuery = useAllProcesses(isUnit)

  const { data: processes = [], isLoading } = isUnit ? unitQuery : isOwn ? ownQuery : sharedQuery

  const [activeTab, setActiveTab] = useState('all')
  const [view, setView] = useState<View>('list')
  const [sort, setSort] = useState<SortKey>('default')
  const [search, setSearch] = useState('')
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const savedView = localStorage.getItem(LS_KEY) as View | null
    const savedSort = localStorage.getItem(LS_SORT_KEY) as SortKey | null
    if (savedSort) setSort(savedSort)

    const mq = window.matchMedia('(max-width: 640px)')
    if (mq.matches) {
      setView('cards')
    } else if (savedView) {
      setView(savedView)
    }

    function onMq(e: MediaQueryListEvent) {
      if (e.matches) setView('cards')
    }
    mq.addEventListener('change', onMq)
    return () => mq.removeEventListener('change', onMq)
  }, [])

  useLayoutEffect(() => {
    const idx = TABS.findIndex((t) => t.key === activeTab)
    const el = tabRefs.current[idx]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab])

  const toggleView = useCallback((v: View) => {
    setView(v)
    localStorage.setItem(LS_KEY, v)
  }, [])

  const changeSort = useCallback((v: SortKey) => {
    setSort(v)
    localStorage.setItem(LS_SORT_KEY, v)
  }, [])

  const counts = useMemo(() => ({
    all: processes.length,
    active: processes.filter((p) => p.status === 'active').length,
    in_progress: processes.filter((p) => p.status === 'in_progress').length,
    delayed: processes.filter((p) => p.status === 'delayed').length,
    completed: processes.filter((p) => p.status === 'completed').length,
  }), [processes])

  const visible = useMemo(() => {
    let list = activeTab === 'all' ? processes : processes.filter((p) => p.status === activeTab)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) || p.responsible.toLowerCase().includes(q)
      )
    }

    if (sort === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    } else if (sort === 'deadline') {
      list = [...list].sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    } else if (sort === 'priority') {
      list = [...list].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99))
    } else if (sort === 'status') {
      list = [...list].sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))
    }
    return list
  }, [processes, activeTab, search, sort])

  if (isLoading) return <ProcessesSkeleton title={title} subtitle={subtitle} />

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          {isOwn && (
            <Link href="/processes/new">
              <button className="btn primary">+ Novo processo</button>
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ position: 'relative' }}>
          {indicator.width > 0 && (
            <span
              style={{
                position: 'absolute',
                bottom: -1,
                height: 2,
                background: 'var(--ink)',
                left: indicator.left,
                width: indicator.width,
                transition: 'left 0.22s cubic-bezier(.4,0,.2,1), width 0.22s cubic-bezier(.4,0,.2,1)',
              }}
            />
          )}
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              ref={(el) => { tabRefs.current[i] = el }}
              className={`tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="c">{counts[tab.key as keyof typeof counts] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Search + sort toolbar */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" /><path d="M12 12l3 3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por título ou responsável…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 32, paddingRight: search ? 32 : 10,
                height: 36, border: '1px solid var(--line)', borderRadius: 6,
                background: 'var(--panel)', color: 'var(--ink)', fontSize: 13,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Limpar busca"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)', display: 'flex' }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value as SortKey)}
            style={{ height: 36, padding: '0 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--panel)', color: 'var(--ink)', fontSize: 13, cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        {view === 'list'
          ? <ListView processes={visible} search={search} tab={activeTab} isShared={mode === 'shared'} />
          : <CardsView processes={visible} search={search} tab={activeTab} isShared={mode === 'shared'} />
        }

        <div className="pagination">
          <span>{visible.length} processo{visible.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </>
  )
}
