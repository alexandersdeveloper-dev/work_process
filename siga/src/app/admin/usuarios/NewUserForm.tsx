'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/lib/auth-guard'
import { validatePassword } from '@/lib/password-policy'
import type { UserRole } from '@/types'

const ROLES: UserRole[] = ['admin', 'chefe', 'servidor']

export default function NewUserForm({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void } = {}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('servidor')
  const [cargo, setCargo] = useState('')
  const [forceChange, setForceChange] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() || !password || !fullName.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) {
      setError(pwCheck.error ?? 'Senha inválida.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role,
          cargo: cargo.trim() || null,
          force_password_change: forceChange,
        }),
      })

      let json: { error?: string; id?: string } = {}
      try {
        json = await res.json()
      } catch {
        // resposta não é JSON (ex: erro 500 do servidor)
      }

      if (!res.ok) {
        setError(json.error ?? 'Erro ao criar usuário. Tente novamente.')
        setLoading(false)
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/usuarios')
        router.refresh()
      }
    } catch {
      setError('Falha na conexão. Verifique sua rede e tente novamente.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nome completo *</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nome do usuário"
        />
      </div>
      <div className="form-group">
        <label>E-mail *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@email.com"
        />
      </div>
      <div className="form-group">
        <label>Senha temporária *</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
        />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input
          id="force-change"
          type="checkbox"
          checked={forceChange}
          onChange={(e) => setForceChange(e.target.checked)}
          style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
        />
        <label htmlFor="force-change" style={{ margin: 0, cursor: 'pointer', fontSize: 14 }}>
          Obrigar troca de senha no primeiro acesso
        </label>
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? 'Criando…' : 'Criar usuário'}
        </button>
        <button type="button" className="btn ghost" onClick={() => onCancel ? onCancel() : router.back()}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
