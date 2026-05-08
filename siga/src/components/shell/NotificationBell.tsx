'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import type { AppNotification } from '@/types'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function notifHref(n: AppNotification): string | null {
  if (n.related_type === 'process' && n.related_id) return `/processes/${n.related_id}`
  if (n.related_type === 'comunicado' && n.related_id) return `/comunicados`
  if (n.related_type === 'folga') return `/calendario`
  return null
}

const TYPE_ICONS: Record<string, string> = {
  process_shared: '🔗',
  new_comunicado: '📢',
  folga_registered: '📅',
  deadline_soon: '⚠️',
}

export default function NotificationBell() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications((data as AppNotification[]) ?? [])
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Realtime subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: { new: AppNotification }) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  async function markRead(n: AppNotification) {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))
    }
    const href = notifHref(n)
    setOpen(false)
    if (href) router.push(href)
  }

  async function markAllRead() {
    if (!user || unread === 0) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 6, borderRadius: 6, color: 'var(--muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transition: 'color 0.15s',
        }}
        title="Notificações"
        aria-label="Notificações"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: 'var(--danger)', color: '#fff',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
            display: 'grid', placeItems: 'center',
            border: '2px solid var(--panel)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 340, maxHeight: 420, overflowY: 'auto',
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          zIndex: 300,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid var(--line)',
            position: 'sticky', top: 0, background: 'var(--panel)',
          }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Notificações</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markRead(n)}
                style={{
                  display: 'flex', gap: 10, padding: '12px 16px',
                  borderBottom: '1px solid var(--line-2)',
                  cursor: notifHref(n) ? 'pointer' : 'default',
                  background: n.read ? 'transparent' : 'var(--accent-soft)',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--ink)' }}>
                    {n.title}
                  </div>
                  {n.body && (
                    <div style={{
                      fontSize: 12, color: 'var(--muted)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {n.body}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0, marginTop: 5,
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
