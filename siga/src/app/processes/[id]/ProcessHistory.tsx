import type { ProcessHistoryEntry } from '@/lib/audit'

const ACTION_LABELS: Record<string, string> = {
  process_created:        'criou este processo',
  process_updated:        'atualizou o processo',
  process_status_changed: 'alterou o status',
  process_deleted:        'excluiu o processo',
  process_shared:         'compartilhou o processo',
  step_added:             'adicionou uma etapa',
  step_updated:           'atualizou uma etapa',
  step_deleted:           'removeu uma etapa',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  return `${days} dia${days !== 1 ? 's' : ''} atrás`
}

function ActionIcon({ action }: { action: string }) {
  if (action.includes('created')) return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" /><path d="M8 5v6M5 8h6" />
    </svg>
  )
  if (action.includes('deleted')) return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--danger)" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" /><path d="M5 8h6" />
    </svg>
  )
  if (action.includes('status')) return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--warning)" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
  if (action.includes('shared')) return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--info)" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="3" r="1.5" /><circle cx="4" cy="8" r="1.5" /><circle cx="12" cy="13" r="1.5" />
      <path d="M5.5 7.2l5-2.9M5.5 8.8l5 2.9" />
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
    </svg>
  )
}

export default function ProcessHistory({ entries }: { entries: ProcessHistoryEntry[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
        </svg>
        <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Histórico de atividade</h3>
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: '28px 20px', color: 'var(--muted)', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
          Nenhuma atividade registrada ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {entries.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 20px',
                borderBottom: i < entries.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--panel-alt)',
                border: '1px solid var(--line)',
                display: 'grid', placeItems: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                <ActionIcon action={e.action} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: 'var(--ink)' }}>
                  <strong>{e.actor?.[0]?.full_name ?? 'Sistema'}</strong>{' '}
                  {ACTION_LABELS[e.action] ?? e.action}
                  {e.metadata?.to != null && (
                    <span style={{ color: 'var(--muted)' }}> → {String(e.metadata.to)}</span>
                  )}
                </span>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }} suppressHydrationWarning>
                  {timeAgo(e.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
