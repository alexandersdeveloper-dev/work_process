'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ROLE_LABELS } from '@/lib/auth-guard'
import { validatePassword } from '@/lib/password-policy'
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

  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forceChange, setForceChange] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (newPassword) {
      const { valid, error: pwErr } = validatePassword(newPassword)
      if (!valid) { setError(pwErr!); return }
    }

    setLoading(true)

    // 1. Atualiza perfil
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), role, cargo: cargo.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (profileErr) { setError('Erro ao salvar perfil.'); setLoading(false); return }

    // 2. Atualiza senha e/ou flag de redefinição se necessário
    if (newPassword || forceChange) {
      const res = await fetch(`/api/admin/users/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(newPassword ? { password: newPassword } : {}),
          forceChange,
        }),
      })

      if (!res.ok) {
        let msg = 'Erro ao atualizar senha.'
        try { const d = await res.json(); msg = d.error ?? msg } catch { /* noop */ }
        setError(msg)
        setLoading(false)
        return
      }
    }

    setLoading(false)
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

      {/* Seção de redefinição de senha */}
      <div style={{ borderTop: '1px solid var(--line)', margin: '8px 0 16px', paddingTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>
          Redefinição de senha
        </div>

        <div className="form-group" style={{ marginBottom: 10 }}>
          <label>Nova senha <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(deixe em branco para não alterar)</span></label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
              autoComplete="new-password"
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2,
                display: 'flex', alignItems: 'center',
              }}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={forceChange}
            onChange={(e) => setForceChange(e.target.checked)}
            style={{ width: 'auto', marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 500, color: 'var(--ink)' }}>Exigir redefinição no próximo login</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              O usuário será redirecionado para criar uma nova senha ao entrar.
            </div>
          </div>
        </label>
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
