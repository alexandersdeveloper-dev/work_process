'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import { useQueryClient } from '@tanstack/react-query'
import { canPublish } from '@/lib/auth-guard'
import type { Comunicado, ComunicadoType } from '@/types'
import { COMUNICADO_TYPE_LABELS } from '@/types'
import { useComunicados } from '@/hooks/use-comunicados'
import { queryKeys } from '@/lib/query-keys'
import ComunicadoForm from './ComunicadoForm'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TYPE_PILL: Record<ComunicadoType, string> = {
  aviso:       'warning',
  comunicado:  'info',
  informativo: 'success',
}

function ComunicadoCard({ comunicado, canManage, onDelete }: {
  comunicado: Comunicado
  canManage: boolean
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const isEdited = comunicado.updated_at !== comunicado.created_at
  const typePill = TYPE_PILL[comunicado.type] ?? 'info'

  async function handleDelete() {
    if (!confirm('Excluir este comunicado?')) return
    setDeleting(true)
    await supabase.from('comunicados').delete().eq('id', comunicado.id)
    onDelete(comunicado.id)
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)', color: 'var(--bg)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
        }}>
          {(comunicado.author?.full_name ?? 'A').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={`pill ${typePill}`} style={{ fontSize: 11 }}>
              {COMUNICADO_TYPE_LABELS[comunicado.type]}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{comunicado.title}</span>
            {comunicado.target_user_ids && comunicado.target_user_ids.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="6" cy="5" r="3" /><path d="M1 14a5 5 0 0110 0" /><path d="M13 7l2 2 2-2" strokeLinecap="round" />
                </svg>
                {comunicado.target_user_ids.length} usuário{comunicado.target_user_ids.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {comunicado.author?.full_name ?? '—'} · {formatDate(comunicado.created_at)}
            {isEdited && <span style={{ marginLeft: 6, fontStyle: 'italic' }}>(editado)</span>}
          </div>
          {!expanded && (
            <div style={{
              fontSize: 13, color: 'var(--ink-2)', marginTop: 6,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {comunicado.body}
            </div>
          )}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ flexShrink: 0, color: 'var(--muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" />
        </svg>
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 18px 70px', borderTop: '1px solid var(--line)' }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink-2)', whiteSpace: 'pre-wrap', paddingTop: 14 }}>
            {comunicado.body}
          </p>
          {canManage && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Link href={`/comunicados/${comunicado.id}/edit`}>
                <button className="btn sm ghost">Editar</button>
              </Link>
              <button className="btn sm ghost" onClick={handleDelete} disabled={deleting}
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NovoComunicadoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
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
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--line)',
          position: 'sticky', top: 0, background: 'var(--panel)', zIndex: 1,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Novo comunicado</h3>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }} aria-label="Fechar">✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <ComunicadoForm onSuccess={onSuccess} />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function ComunicadosClient() {
  const { user, profile } = useUser()
  const userId = user?.id ?? ''
  const role = profile?.role ?? ''
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [, startTransition] = useTransition()
  const canManage = canPublish(role || null)

  const { data: list = [], isLoading } = useComunicados(userId, role)

  function handleDelete(id: string) {
    queryClient.setQueryData<Comunicado[]>(
      queryKeys.comunicados(userId, role),
      (old) => old?.filter((c) => c.id !== id) ?? []
    )
    startTransition(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comunicados(userId, role) })
    })
  }

  function handleSuccess() {
    setShowModal(false)
    queryClient.invalidateQueries({ queryKey: queryKeys.comunicados(userId, role) })
  }

  if (isLoading) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Comunicado Institucional</h1>
            <p className="sub">Avisos, comunicados e informativos da equipe</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 80, borderRadius: 8,
              background: 'var(--panel-alt)',
              border: '1px solid var(--line)',
              animation: 'pulse 1.2s ease-in-out infinite',
            }} />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Comunicado Institucional</h1>
          <p className="sub">Avisos, comunicados e informativos da equipe</p>
        </div>
        {canManage && (
          <button className="btn primary" onClick={() => setShowModal(true)}>
            + Novo comunicado
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: '48px 24px' }}>
            <p>Nenhum comunicado publicado ainda.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((c) => (
            <ComunicadoCard
              key={c.id}
              comunicado={c}
              canManage={canManage || c.author_id === profile?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NovoComunicadoModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
