'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { useUser } from '@/lib/user-context'
import { useQueryClient } from '@tanstack/react-query'
import { useProfiles } from '@/hooks/use-profiles'
import { useKanbanShares } from '@/hooks/use-kanban-shares'
import { queryKeys } from '@/lib/query-keys'
import { useActionLoader } from '@/contexts/ActionLoaderContext'
import { useToast } from '@/contexts/ToastContext'
import type { KanbanCardWithShare, Profile } from '@/types'

interface Props {
  card: KanbanCardWithShare
  userId: string
  onClose: () => void
}

export default function KanbanShareModal({ card, userId, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const modalRef = useFocusTrap(mounted)
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { showLoader, hideLoader } = useActionLoader()
  const { showToast } = useToast()

  const { data: users = [], isLoading: loadingUsers } = useProfiles()
  const { data: shares = [] } = useKanbanShares(card.id)

  useEffect(() => { setMounted(true) }, [])

  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [close])

  const sharedWithIds = new Set(shares.map((s) => s.shared_with_user_id))

  async function toggleShare(targetUser: Profile) {
    if (loading) return
    setLoading(true)
    showLoader()
    const alreadyShared = sharedWithIds.has(targetUser.id)

    try {
      if (alreadyShared) {
        await supabase
          .from('kanban_shares')
          .delete()
          .eq('card_id', card.id)
          .eq('shared_with_user_id', targetUser.id)
      } else {
        await supabase
          .from('kanban_shares')
          .insert({
            card_id: card.id,
            shared_with_user_id: targetUser.id,
            shared_by_user_id: user!.id,
          })

        await supabase.from('notifications').insert({
          user_id: targetUser.id,
          type: 'kanban_shared',
          title: 'Card Kanban compartilhado com você',
          body: `"${card.title}" foi compartilhado com você.`,
          related_id: card.id,
          related_type: 'kanban_card',
        })
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanShares(card.id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanCards(userId) })
      showToast(alreadyShared ? 'Acesso removido.' : 'Card compartilhado.')
    } catch {
      showToast('Erro ao atualizar compartilhamento.', 'error')
    } finally {
      setLoading(false)
      hideLoader()
    }
  }

  const eligibleUsers = users.filter((u) => u.id !== userId)

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'modal-bg-in 0.18s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--line)',
          position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1,
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Compartilhar card</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{card.title}</p>
          </div>
          <button
            onClick={close}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}
            aria-label="Fechar"
          >✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {loadingUsers ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skel" style={{ height: 56, borderRadius: 6 }} />
              ))}
            </div>
          ) : eligibleUsers.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum usuário disponível para compartilhar.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eligibleUsers.map((u) => {
                const shared = sharedWithIds.has(u.id)
                return (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    background: shared ? 'var(--accent-soft)' : 'var(--panel-alt)',
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{u.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>{u.role}</div>
                    </div>
                    <button
                      className={`btn sm ${shared ? 'ghost' : 'primary'}`}
                      disabled={loading}
                      onClick={() => toggleShare(u)}
                    >
                      {shared ? 'Remover acesso' : 'Compartilhar'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
