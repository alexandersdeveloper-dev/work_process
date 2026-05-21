'use client'

import { useState, useMemo, useLayoutEffect, useTransition, useEffect, useRef, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import {
  STATUS_LABELS, STATUS_KIND,
  getProcessTypeLabel, PRIORITY_LABELS, PRIORITY_KIND,
} from '@/types'
import type { Process, ProcessStatus } from '@/types'
import { useUser } from '@/lib/user-context'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useProcesses, useSharedProcesses, useAllProcesses, PROCESS_LIMIT } from '@/hooks/use-processes'
import { queryKeys } from '@/lib/query-keys'
import { useActionLoader } from '@/contexts/ActionLoaderContext'
import { useToast } from '@/contexts/ToastContext'
import { PRIORITY_ORDER, STATUS_ORDER, formatDateShort, formatDateMedium, deadlineKind } from '@/lib/process-utils'
import { exportToCSV } from '@/lib/export-csv'

const LS_KEY = 'siga_process_view'
const LS_SORT_KEY = 'siga_process_sort'
const LS_FILTER_KEY = 'siga_process_filter'

type DeadlineFilter = '' | 'overdue' | 'soon' | 'none'

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

const DEADLINE_FILTER_OPTIONS: { key: DeadlineFilter; label: string }[] = [
  { key: '', label: 'Todos os prazos' },
  { key: 'overdue', label: 'Vencidos' },
  { key: 'soon', label: 'Próximos 7 dias' },
  { key: 'none', label: 'Sem prazo' },
]

const BULK_STATUS_OPTIONS: { key: ProcessStatus; label: string }[] = [
  { key: 'active', label: 'Ativo' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'delayed', label: 'Atrasado' },
  { key: 'completed', label: 'Concluído' },
  { key: 'cancelled', label: 'Cancelado' },
]

type View = 'list' | 'cards'
type SortKey = 'default' | 'deadline' | 'priority' | 'status' | 'title'

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
          <div key={i} className="skel" style={{ height: 44 }} />
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
  if (isShared) {
    return (
      <div className="empty" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.3">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.7 10.7l6.6-4M8.7 13.3l6.6 4" strokeLinecap="round" />
        </svg>
        <p style={{ margin: 0 }}>Nenhum processo foi compartilhado com você ainda.</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Peça a um colega para compartilhar um processo com você.</p>
      </div>
    )
  }
  if (tab === 'completed') {
    return (
      <div className="empty" style={{ padding: '48px 24px' }}>
        <p>Nenhum processo concluído ainda.</p>
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
const ListView = memo(function ListView({
  processes, search, tab, isShared,
  selectedIds, onToggle, onSelectAll, allSelected, selectionEnabled,
}: {
  processes: Process[]
  search: string
  tab: string
  isShared: boolean
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
  allSelected: boolean
  selectionEnabled: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  if (processes.length === 0) return <EmptyState search={search} tab={tab} isShared={isShared} />

  return (
    <div className="table-wrap">
      <table className="t">
        <thead>
          <tr>
            {selectionEnabled && (
              <th scope="col" style={{ width: 36, padding: '0 0 0 16px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  style={{ cursor: 'pointer' }}
                  aria-label="Selecionar todos"
                />
              </th>
            )}
            <th scope="col">Título</th>
            <th scope="col">Tipo</th>
            <th scope="col">Prioridade</th>
            <th scope="col">Status</th>
            <th scope="col">Responsável</th>
            <th scope="col">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => {
            const dk = deadlineKind(p.deadline)
            const isSelected = selectedIds.has(p.id)
            return (
              <tr
                key={p.id}
                onClick={() => startTransition(() => router.push(`/processes/${p.id}`))}
                style={{ cursor: 'pointer', background: isSelected ? 'var(--accent-soft)' : undefined }}
              >
                {selectionEnabled && (
                  <td style={{ width: 36, padding: '0 0 0 16px' }} onClick={(e) => { e.stopPropagation(); onToggle(p.id) }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(p.id)}
                      style={{ cursor: 'pointer' }}
                      aria-label={`Selecionar ${p.title}`}
                    />
                  </td>
                )}
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
                        {formatDateShort(p.deadline)}
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
})

/* ---------- Cards view ---------- */
const CardsView = memo(function CardsView({
  processes, search, tab, isShared,
  selectedIds, onToggle, selectionEnabled,
}: {
  processes: Process[]
  search: string
  tab: string
  isShared: boolean
  selectedIds: Set<string>
  onToggle: (id: string) => void
  selectionEnabled: boolean
}) {
  if (processes.length === 0) return <EmptyState search={search} tab={tab} isShared={isShared} />

  return (
    <div className="process-cards">
      {processes.map((p) => {
        const dk = deadlineKind(p.deadline)
        const isSelected = selectedIds.has(p.id)
        return (
          <Link
            key={p.id}
            href={`/processes/${p.id}`}
            className="process-card"
            style={isSelected ? { outline: '2px solid var(--accent)', outlineOffset: -1 } : undefined}
          >
            {selectionEnabled && (
              <span
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(p.id) }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(p.id)}
                  style={{ cursor: 'pointer', width: 15, height: 15 }}
                  aria-label={`Selecionar ${p.title}`}
                />
              </span>
            )}
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
                  <span suppressHydrationWarning>{formatDateMedium(p.deadline)}</span>
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
})

/* ---------- Main component ---------- */
export default function ProcessesClient({
  mode = 'own',
  title = 'Meus Processos',
  subtitle = 'Seus processos de trabalho',
  initialProcesses,
}: {
  mode?: 'own' | 'shared' | 'unit'
  title?: string
  subtitle?: string
  initialProcesses?: Process[]
}) {
  const { user, profile } = useUser()
  const userId = user?.id ?? ''
  const canExport = profile?.role === 'chefe' || profile?.role === 'admin'
  const isOwn = mode === 'own'
  const isUnit = mode === 'unit'

  const ownQuery = useProcesses(userId, isOwn, isOwn ? initialProcesses : undefined)
  const sharedQuery = useSharedProcesses(userId, mode === 'shared', mode === 'shared' ? initialProcesses : undefined)
  const unitQuery = useAllProcesses(isUnit, isUnit ? initialProcesses : undefined)

  const { data: processes = [], isLoading } = isUnit ? unitQuery : isOwn ? ownQuery : sharedQuery

  const queryClient = useQueryClient()
  const { showLoader, hideLoader } = useActionLoader()
  const { showToast } = useToast()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState('all')
  const [view, setView] = useState<View>('list')
  const [sort, setSort] = useState<SortKey>('default')
  const [search, setSearch] = useState('')
  const [filterDeadline, setFilterDeadline] = useState<DeadlineFilter>('')
  const [filterType, setFilterType] = useState('')
  const [filterResponsible, setFilterResponsible] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkLoading, setIsBulkLoading] = useState(false)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const savedView = localStorage.getItem(LS_KEY) as View | null
    const savedSort = localStorage.getItem(LS_SORT_KEY) as SortKey | null
    if (savedSort) setSort(savedSort)

    const savedFilters = localStorage.getItem(LS_FILTER_KEY)
    if (savedFilters) {
      try {
        const f = JSON.parse(savedFilters)
        if (f.deadline) setFilterDeadline(f.deadline as DeadlineFilter)
        if (f.type) setFilterType(f.type)
        if (f.responsible) setFilterResponsible(f.responsible)
      } catch {}
    }

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

  useEffect(() => {
    setSelectedIds(new Set())
  }, [activeTab, filterDeadline, filterType, filterResponsible])

  useLayoutEffect(() => {
    const idx = TABS.findIndex((t) => t.key === activeTab)
    const el = tabRefs.current[idx]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeTab])

  const saveFilters = useCallback((deadline: DeadlineFilter, type: string, responsible: string) => {
    localStorage.setItem(LS_FILTER_KEY, JSON.stringify({ deadline, type, responsible }))
  }, [])

  const setDeadlineFilter = useCallback((v: DeadlineFilter) => {
    setFilterDeadline(v)
    saveFilters(v, filterType, filterResponsible)
  }, [filterType, filterResponsible, saveFilters])

  const setTypeFilter = useCallback((v: string) => {
    setFilterType(v)
    saveFilters(filterDeadline, v, filterResponsible)
  }, [filterDeadline, filterResponsible, saveFilters])

  const setResponsibleFilter = useCallback((v: string) => {
    setFilterResponsible(v)
    saveFilters(filterDeadline, filterType, v)
  }, [filterDeadline, filterType, saveFilters])

  const clearFilters = useCallback(() => {
    setFilterDeadline('')
    setFilterType('')
    setFilterResponsible('')
    localStorage.removeItem(LS_FILTER_KEY)
  }, [])

  const toggleView = useCallback((v: View) => {
    setView(v)
    localStorage.setItem(LS_KEY, v)
  }, [])

  const changeSort = useCallback((v: SortKey) => {
    setSort(v)
    localStorage.setItem(LS_SORT_KEY, v)
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const availableTypes = useMemo(() => [...new Set(processes.map((p) => p.type))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [processes])
  const availableResponsibles = useMemo(() => [...new Set(processes.map((p) => p.responsible).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [processes])

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

    if (filterType) {
      list = list.filter((p) => p.type === filterType)
    }

    if (filterResponsible) {
      list = list.filter((p) => p.responsible === filterResponsible)
    }

    if (filterDeadline) {
      const today = new Date().toISOString().split('T')[0]
      const soon = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
      if (filterDeadline === 'overdue') list = list.filter((p) => p.deadline && p.deadline < today)
      else if (filterDeadline === 'soon') list = list.filter((p) => p.deadline && p.deadline >= today && p.deadline <= soon)
      else if (filterDeadline === 'none') list = list.filter((p) => !p.deadline)
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
  }, [processes, activeTab, search, sort, filterType, filterResponsible, filterDeadline])

  const handleExport = useCallback(() => {
    const header = ['Título', 'Tipo', 'Status', 'Prioridade', 'Responsável', 'Prazo', 'Criado em']
    const STATUS_PT: Record<string, string> = {
      active: 'Ativo', in_progress: 'Em andamento', delayed: 'Atrasado',
      completed: 'Concluído', cancelled: 'Cancelado',
    }
    const PRIORITY_PT: Record<string, string> = {
      low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
    }
    const rows = visible.map((p) => [
      p.title,
      p.type,
      STATUS_PT[p.status] ?? p.status,
      PRIORITY_PT[p.priority] ?? p.priority,
      p.responsible,
      p.deadline ? formatDateMedium(p.deadline) : '',
      formatDateMedium(p.created_at),
    ])
    exportToCSV([header, ...rows], `processos-${new Date().toISOString().split('T')[0]}.csv`)
  }, [visible])

  const handleBulkMove = useCallback(async (status: ProcessStatus) => {
    if (selectedIds.size === 0 || isBulkLoading) return
    const ids = [...selectedIds]
    setIsBulkLoading(true)
    showLoader()
    try {
      const { error } = await supabase
        .from('processes')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids)
      if (error) throw error

      const updater = (old: Process[] | undefined) =>
        old?.map((p) => ids.includes(p.id) ? { ...p, status } : p) ?? []

      if (isOwn) queryClient.setQueryData(queryKeys.processes(userId, 'own'), updater)
      if (isUnit) queryClient.setQueryData(queryKeys.allProcesses(), updater)

      await queryClient.invalidateQueries({ queryKey: isUnit ? queryKeys.allProcesses() : queryKeys.processes(userId, 'own') })
      setSelectedIds(new Set())
      showToast(`${ids.length} processo${ids.length !== 1 ? 's' : ''} movido${ids.length !== 1 ? 's' : ''} para ${STATUS_LABELS[status]}.`)
    } catch {
      showToast('Erro ao mover processos.', 'error')
    } finally {
      hideLoader()
      setIsBulkLoading(false)
    }
  }, [selectedIds, isBulkLoading, userId, isOwn, isUnit, queryClient, supabase, showLoader, hideLoader, showToast])

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0 || isBulkLoading) return
    const ids = [...selectedIds]
    setIsBulkLoading(true)
    showLoader()
    try {
      const { error } = await supabase
        .from('processes')
        .delete()
        .in('id', ids)
      if (error) throw error

      const updater = (old: Process[] | undefined) =>
        old?.filter((p) => !ids.includes(p.id)) ?? []

      if (isOwn) queryClient.setQueryData(queryKeys.processes(userId, 'own'), updater)
      if (isUnit) queryClient.setQueryData(queryKeys.allProcesses(), updater)

      await queryClient.invalidateQueries({ queryKey: isUnit ? queryKeys.allProcesses() : queryKeys.processes(userId, 'own') })
      setSelectedIds(new Set())
      showToast(`${ids.length} processo${ids.length !== 1 ? 's' : ''} excluído${ids.length !== 1 ? 's' : ''}.`)
    } catch {
      showToast('Erro ao excluir processos.', 'error')
    } finally {
      hideLoader()
      setIsBulkLoading(false)
    }
  }, [selectedIds, isBulkLoading, userId, isOwn, isUnit, queryClient, supabase, showLoader, hideLoader, showToast])

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selectedIds.has(p.id))

  const handleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visible.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visible.forEach((p) => next.add(p.id))
        return next
      })
    }
  }, [allVisibleSelected, visible])

  const hasActiveFilters = filterDeadline !== '' || filterType !== '' || filterResponsible !== ''
  const selectionEnabled = isOwn || isUnit

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
          {canExport && visible.length > 0 && (
            <button className="btn ghost" onClick={handleExport} title="Exportar CSV" aria-label="Exportar CSV">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2v9M5 8l3 3 3-3M2 13h12" />
              </svg>
            </button>
          )}
          {isOwn && (
            <Link href="/processes/new">
              <button className="btn primary">+ Novo processo</button>
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="tabs" role="tablist" aria-label="Filtrar processos" style={{ position: 'relative' }}>
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
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`processes-panel-${tab.key}`}
              className={`tab${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="c">{counts[tab.key as keyof typeof counts] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* Search + sort + filter toolbar */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" /><path d="M12 12l3 3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por título ou responsável…"
              aria-label="Buscar processos"
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

          {/* Deadline filter */}
          <select
            value={filterDeadline}
            onChange={(e) => setDeadlineFilter(e.target.value as DeadlineFilter)}
            style={{ height: 36, padding: '0 10px', border: `1px solid ${filterDeadline ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 6, background: 'var(--panel)', color: filterDeadline ? 'var(--accent)' : 'var(--ink)', fontSize: 13, cursor: 'pointer' }}
            aria-label="Filtrar por prazo"
          >
            {DEADLINE_FILTER_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>

          {/* Type filter */}
          {availableTypes.length > 1 && (
            <select
              value={filterType}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ height: 36, padding: '0 10px', border: `1px solid ${filterType ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 6, background: 'var(--panel)', color: filterType ? 'var(--accent)' : 'var(--ink)', fontSize: 13, cursor: 'pointer' }}
              aria-label="Filtrar por tipo"
            >
              <option value="">Todos os tipos</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>{getProcessTypeLabel(t)}</option>
              ))}
            </select>
          )}

          {/* Responsible filter — chefe/admin only */}
          {(profile?.role === 'chefe' || profile?.role === 'admin') && availableResponsibles.length > 1 && (
            <select
              value={filterResponsible}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              style={{ height: 36, padding: '0 10px', border: `1px solid ${filterResponsible ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 6, background: 'var(--panel)', color: filterResponsible ? 'var(--accent)' : 'var(--ink)', fontSize: 13, cursor: 'pointer' }}
              aria-label="Filtrar por responsável"
            >
              <option value="">Todos os responsáveis</option>
              {availableResponsibles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

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

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 20px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros:</span>
            {filterDeadline && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>
                {DEADLINE_FILTER_OPTIONS.find((o) => o.key === filterDeadline)?.label}
                <button onClick={() => setDeadlineFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--accent)', lineHeight: 1 }} aria-label="Remover filtro de prazo">✕</button>
              </span>
            )}
            {filterType && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>
                {getProcessTypeLabel(filterType)}
                <button onClick={() => setTypeFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--accent)', lineHeight: 1 }} aria-label="Remover filtro de tipo">✕</button>
              </span>
            )}
            {filterResponsible && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>
                {filterResponsible}
                <button onClick={() => setResponsibleFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--accent)', lineHeight: 1 }} aria-label="Remover filtro de responsável">✕</button>
              </span>
            )}
            <button
              onClick={clearFilters}
              style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', textDecoration: 'underline' }}
            >
              Limpar todos
            </button>
          </div>
        )}

        <div id={`processes-panel-${activeTab}`} role="tabpanel">
          {view === 'list'
            ? <ListView
                processes={visible}
                search={search}
                tab={activeTab}
                isShared={mode === 'shared'}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                onSelectAll={handleSelectAll}
                allSelected={allVisibleSelected}
                selectionEnabled={selectionEnabled}
              />
            : <CardsView
                processes={visible}
                search={search}
                tab={activeTab}
                isShared={mode === 'shared'}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
                selectionEnabled={selectionEnabled}
              />
          }
        </div>

        <div className="pagination">
          <span>{visible.length} processo{visible.length !== 1 ? 's' : ''}</span>
          {processes.length >= PROCESS_LIMIT && (
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
              · Exibindo os {PROCESS_LIMIT} mais recentes
            </span>
          )}
        </div>
      </div>

      {/* Bulk action toolbar */}
      {selectionEnabled && selectedIds.size > 0 && typeof window !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200,
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          animation: 'modal-panel-in 0.18s cubic-bezier(.34,1.56,.64,1) both',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', paddingRight: 4 }}>
            {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div style={{ width: 1, height: 20, background: 'var(--line)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Mover para:</span>
          <select
            disabled={isBulkLoading}
            onChange={(e) => { if (e.target.value) handleBulkMove(e.target.value as ProcessStatus) }}
            value=""
            style={{ height: 30, padding: '0 8px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--panel)', color: 'var(--ink)', fontSize: 12, cursor: 'pointer' }}
            aria-label="Mover selecionados para status"
          >
            <option value="" disabled>Selecionar status…</option>
            {BULK_STATUS_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <div style={{ width: 1, height: 20, background: 'var(--line)' }} />
          <button
            onClick={handleBulkDelete}
            disabled={isBulkLoading}
            style={{ height: 30, padding: '0 12px', border: '1px solid var(--danger)', borderRadius: 6, background: 'transparent', color: 'var(--danger)', fontSize: 12, cursor: isBulkLoading ? 'not-allowed' : 'pointer', fontWeight: 500 }}
          >
            Excluir
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{ height: 30, padding: '0 10px', border: '1px solid var(--line)', borderRadius: 6, background: 'transparent', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}
            aria-label="Cancelar seleção"
          >
            ✕
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
