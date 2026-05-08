'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface Props {
  initialDate?: string
  onClose: () => void
}

export default function AddFolgaModal({ initialDate = '', onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<Profile[]>([])
  const [userId, setUserId] = useState('')
  const [date, setDate] = useState(initialDate)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useUser()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'servidor')
      const profiles = (data as Profile[] | null) ?? []
      setUsers(profiles)
      if (profiles.length > 0) setUserId(profiles[0].id)
    }
    load()
  }, [])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !date) { setError('Selecione o servidor e a data.'); return }
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.from('folgas').insert({
      user_id: userId,
      registered_by: user!.id,
      date,
      description: description.trim() || null,
    }).select().single()

    if (err) { setError(err.message); setLoading(false); return }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'folga_registered',
      title: 'Folga registrada',
      body: `Uma folga foi registrada para ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
      related_id: data.id,
      related_type: 'folga',
    })

    router.refresh()
    close()
  }

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'modal-bg-in 0.18s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8,
        width: '100%', maxWidth: 440,
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--line)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Registrar folga</h3>
          <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div className="form-group">
            <label>Servidor *</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
              {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Data *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Observação</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Férias, licença médica…" />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Salvando…' : 'Registrar folga'}
            </button>
            <button type="button" className="btn ghost" onClick={close}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
