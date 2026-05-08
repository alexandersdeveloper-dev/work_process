'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { validatePassword } from '@/lib/password-policy'

export default function MudarSenhaPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) { setError(pwCheck.error!); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({
      password,
      data: { force_password_change: false },
    })

    if (err) {
      setError('Não foi possível alterar a senha. Tente novamente.')
      setLoading(false)
      return
    }

    // Hard redirect: garante que o browser envia o cookie já atualizado ao proxy,
    // evitando o loop onde o JWT antigo ainda carrega force_password_change=true.
    window.location.replace('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Defina sua senha</h1>
          <p className="sub" style={{ marginTop: 4 }}>
            Crie uma nova senha para continuar acessando o sistema
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Confirmar senha</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
            {error && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? 'Salvando…' : 'Definir senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
