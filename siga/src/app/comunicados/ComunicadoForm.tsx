'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import type { Comunicado, ComunicadoType, Profile } from '@/types'
import { COMUNICADO_TYPE_LABELS } from '@/types'

interface Props {
  comunicado?: Comunicado
  onSuccess?: () => void
}

const TYPES: ComunicadoType[] = ['aviso', 'comunicado', 'informativo']

export default function ComunicadoForm({ comunicado, onSuccess }: Props) {
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()
  const isEdit = !!comunicado

  const [title, setTitle] = useState(comunicado?.title ?? '')
  const [body, setBody] = useState(comunicado?.body ?? '')
  const [type, setType] = useState<ComunicadoType>(comunicado?.type ?? 'comunicado')
  const [targetAll, setTargetAll] = useState(comunicado ? !comunicado.target_user_ids?.length : true)
  const [targetUserIds, setTargetUserIds] = useState<string[]>(comunicado?.target_user_ids ?? [])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfiles() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .neq('id', user!.id)
        .order('full_name')
      setProfiles((data as Profile[]) ?? [])
    }
    if (user) loadProfiles()
  }, [user])

  function toggleUser(id: string) {
    setTargetUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { setError('Título e corpo são obrigatórios.'); return }
    if (!targetAll && targetUserIds.length === 0) { setError('Selecione pelo menos um destinatário ou escolha "Todos".'); return }
    setLoading(true)
    setError('')

    const resolvedTargetIds = targetAll ? null : targetUserIds

    if (isEdit) {
      const { error: err } = await supabase
        .from('comunicados')
        .update({
          title: title.trim(),
          body: body.trim(),
          type,
          target_user_ids: resolvedTargetIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', comunicado.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { data, error: err } = await supabase
        .from('comunicados')
        .insert({
          title: title.trim(),
          body: body.trim(),
          type,
          target_user_ids: resolvedTargetIds,
          author_id: user!.id,
        })
        .select()
        .single()
      if (err) { setError(err.message); setLoading(false); return }

      const notifLabel = `Novo ${COMUNICADO_TYPE_LABELS[type]}`
      const relatedId = (data as Comunicado).id

      if (resolvedTargetIds) {
        const notifs = resolvedTargetIds.map((uid) => ({
          user_id: uid,
          type: 'new_comunicado',
          title: notifLabel,
          body: title.trim(),
          related_id: relatedId,
          related_type: 'comunicado',
        }))
        await supabase.from('notifications').insert(notifs)
      } else {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id')
          .neq('id', user!.id)
          .neq('role', 'admin')
        if (allProfiles) {
          const notifs = allProfiles.map((p: { id: string }) => ({
            user_id: p.id,
            type: 'new_comunicado',
            title: notifLabel,
            body: title.trim(),
            related_id: relatedId,
            related_type: 'comunicado',
          }))
          await supabase.from('notifications').insert(notifs)
        }
      }
    }

    setLoading(false)
    if (onSuccess) {
      onSuccess()
    } else {
      router.push('/comunicados')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Tipo */}
      <div className="form-group">
        <label>Tipo *</label>
        <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{
                flex: 1, padding: '9px 0', fontSize: 13, border: 'none', cursor: 'pointer',
                background: type === t ? 'var(--accent)' : 'transparent',
                color: type === t ? 'var(--bg)' : 'var(--ink-2)',
                fontWeight: type === t ? 600 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {COMUNICADO_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div className="form-group">
        <label>Título *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assunto do comunicado" />
      </div>

      {/* Corpo */}
      <div className="form-group">
        <label>Conteúdo *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escreva o comunicado aqui…"
          style={{ minHeight: 160 }}
        />
      </div>

      {/* Destinatários */}
      <div className="form-group">
        <label>Destinatários</label>
        <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
          {(['todos', 'especifico'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setTargetAll(opt === 'todos'); if (opt === 'todos') setTargetUserIds([]) }}
              style={{
                flex: 1, padding: '9px 0', fontSize: 13, border: 'none', cursor: 'pointer',
                background: (opt === 'todos') === targetAll ? 'var(--accent)' : 'transparent',
                color: (opt === 'todos') === targetAll ? 'var(--bg)' : 'var(--ink-2)',
                fontWeight: (opt === 'todos') === targetAll ? 600 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {opt === 'todos' ? 'Todos' : 'Usuários específicos'}
            </button>
          ))}
        </div>

        {!targetAll && (
          <>
            <div style={{
              border: '1px solid var(--line)', borderRadius: 6,
              maxHeight: 220, overflowY: 'auto',
            }}>
              {profiles.length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>
              ) : profiles.map((p) => {
                const checked = targetUserIds.includes(p.id)
                return (
                  <label
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', cursor: 'pointer',
                      background: checked ? 'var(--accent-soft)' : 'transparent',
                      borderBottom: '1px solid var(--line)',
                      transition: 'background 0.12s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUser(p.id)}
                      style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.full_name}</div>
                      {p.cargo && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{p.cargo}</div>}
                    </div>
                  </label>
                )
              })}
            </div>
            {targetUserIds.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                {targetUserIds.length} usuário{targetUserIds.length !== 1 ? 's' : ''} selecionado{targetUserIds.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Publicar comunicado'}
        </button>
      </div>
    </form>
  )
}
