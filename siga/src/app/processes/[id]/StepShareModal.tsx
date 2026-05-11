'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import type { Profile, ProcessShare } from '@/types'

interface Props {
  stepId: string
  stepTitle: string
  processId: string
}

export default function StepShareModal({ stepId, stepTitle, processId }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])
  const [shares, setShares] = useState<ProcessShare[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  useEffect(() => {
    if (!open) return
    async function load() {
      const { data: usersData } = await supabase.from('profiles').select('*').neq('role', 'admin')
      setUsers((usersData as Profile[]) ?? [])
      const { data: sharesData } = await supabase
        .from('process_shares')
        .select('*, profile:profiles!process_shares_shared_with_user_id_fkey(*)')
        .eq('process_id', processId)
      setShares((sharesData as ProcessShare[]) ?? [])
    }
    load()
  }, [open, processId])

  function hasStepAccess(share: ProcessShare): boolean {
    if (share.step_ids === null) return true
    return share.step_ids.includes(stepId)
  }

  async function toggleStepAccess(targetUser: Profile) {
    if (loading) return
    setLoading(true)

    const existingShare = shares.find((s) => s.shared_with_user_id === targetUser.id)

    if (!existingShare) {
      const { data } = await supabase
        .from('process_shares')
        .insert({
          process_id: processId,
          shared_with_user_id: targetUser.id,
          shared_by_user_id: user!.id,
          step_ids: [stepId],
        })
        .select('*, profile:profiles!process_shares_shared_with_user_id_fkey(*)')
        .single()
      if (data) setShares((prev) => [...prev, data as ProcessShare])

      await supabase.from('notifications').insert({
        user_id: targetUser.id,
        type: 'process_shared',
        title: 'Etapa compartilhada com você',
        body: `A etapa "${stepTitle}" foi compartilhada com você.`,
        related_id: processId,
        related_type: 'process',
      })
    } else if (existingShare.step_ids === null) {
      // Acesso completo ao processo — não é possível restringir por aqui
    } else if (hasStepAccess(existingShare)) {
      const newIds = existingShare.step_ids.filter((id) => id !== stepId)
      if (newIds.length === 0) {
        await supabase.from('process_shares').delete().eq('id', existingShare.id)
        setShares((prev) => prev.filter((s) => s.id !== existingShare.id))
      } else {
        await supabase.from('process_shares').update({ step_ids: newIds }).eq('id', existingShare.id)
        setShares((prev) => prev.map((s) => s.id === existingShare.id ? { ...s, step_ids: newIds } : s))
      }
    } else {
      const newIds = [...existingShare.step_ids, stepId]
      await supabase.from('process_shares').update({ step_ids: newIds }).eq('id', existingShare.id)
      setShares((prev) => prev.map((s) => s.id === existingShare.id ? { ...s, step_ids: newIds } : s))
    }

    setLoading(false)
  }

  const eligibleUsers = users.filter((u) => u.id !== user?.id)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontSize: 11, color: 'var(--muted)', background: 'none',
          border: 'none', cursor: 'pointer', padding: '2px 6px', opacity: 0.6,
        }}
        title="Compartilhar esta etapa"
      >
        compartilhar
      </button>

      {mounted && open && createPortal(
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
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            width: '100%',
            maxWidth: 480,
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--line)',
              position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1,
            }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Compartilhar etapa</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stepTitle}
                </p>
              </div>
              <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }} aria-label="Fechar">✕</button>
            </div>

            <div style={{ padding: 20 }}>
              {eligibleUsers.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhum usuário disponível.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {eligibleUsers.map((u) => {
                    const share = shares.find((s) => s.shared_with_user_id === u.id)
                    const fullAccess = share?.step_ids === null
                    const hasAccess = share ? hasStepAccess(share) : false

                    return (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px',
                        border: '1px solid var(--line)',
                        borderRadius: 6,
                        background: hasAccess ? 'var(--accent-soft)' : 'var(--panel-alt)',
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{u.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize' }}>
                            {u.role}{fullAccess ? ' · acesso completo ao processo' : ''}
                          </div>
                        </div>
                        {fullAccess ? (
                          <span style={{ fontSize: 11, color: 'var(--muted)', padding: '4px 10px' }}>Acesso total</span>
                        ) : (
                          <button
                            className={`btn sm ${hasAccess ? 'ghost' : 'primary'}`}
                            disabled={loading}
                            onClick={() => toggleStepAccess(u)}
                          >
                            {hasAccess ? 'Remover acesso' : 'Compartilhar'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
