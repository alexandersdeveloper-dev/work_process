'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ROLE_LABELS } from '@/lib/auth-guard'
import type { Profile, UserRole } from '@/types'

const ROLES: UserRole[] = ['admin', 'chefe', 'servidor']

export default function EditUserForm({
  profile,
  onSuccess,
  onCancel,
}: {
  profile: Profile
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState(profile.full_name)
  const [role, setRole] = useState<UserRole>(profile.role)
  const [cargo, setCargo] = useState(profile.cargo ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), role, cargo: cargo.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (err) { setError(err.message); setLoading(false); return }
    if (onSuccess) {
      onSuccess()
    } else {
      router.push('/admin/usuarios')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nome completo</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do usuário" />
      </div>
      <div className="form-group">
        <label>Cargo</label>
        <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Analista, Coordenador…" />
      </div>
      <div className="form-group">
        <label>Papel</label>
        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" className="btn ghost" onClick={() => onCancel ? onCancel() : router.back()} disabled={loading}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
