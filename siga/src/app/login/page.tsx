'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import LegalModal from './LegalModal'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [clock, setClock]       = useState('')
  const [legal, setLegal]       = useState<'termos' | 'privacidade' | null>(null)

  useEffect(() => {
    function tick() {
      setClock(new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Manaus',
        hour: '2-digit',
        minute: '2-digit',
      }))
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Preencha e-mail e senha.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="login-layout">

      {/* ── Painel esquerdo — branding ── */}
      <section className="login-left">
        <div className="bp-head">
          <div className="bp-mark">WP</div>
          <div>
            <div className="bp-title">SIGA</div>
            <div className="bp-sub">Sistema Integrado de Gestão</div>
          </div>
        </div>

        <div className="bp-body">
          <div className="bp-eyebrow">Acesso restrito · v0.1.0</div>
          <h1 className="bp-h">
            Gestão pública,{' '}
            <em>do protocolo à publicação.</em>
          </h1>
          <p className="bp-p">
            Plataforma interna para tramitação de processos, controle de prazos,
            comunicados institucionais e capacitação. Acesso autenticado por
            servidor habilitado.
          </p>
        </div>

        <div className="bp-foot">
          <span>© 2026 · Work Process</span>
          <span suppressHydrationWarning>PARINTINS · AM{clock ? ` · ${clock}` : ''}</span>
        </div>
      </section>

      {/* ── Painel direito — formulário ── */}
      <section className="login-right">
        <div className="fp-body">
          <h2 className="fp-h">Entrar no sistema</h2>
          <p className="fp-sub">Informe suas credenciais institucionais para continuar.</p>

          {error && (
            <div className="login-error">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="10" cy="10" r="7" /><path d="M10 7V11M10 13.5V13.6" />
              </svg>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-fields">
            <div>
              <div className="login-lbl">E-mail institucional</div>
              <div className="inp-wrap">
                <svg className="inp-ic" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="7" r="3" /><path d="M3 17c0-3.5 3-6 7-6s7 2.5 7 6" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder=""
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="login-lbl">Senha</div>
              <div className="inp-wrap">
                <svg className="inp-ic" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="9" width="12" height="9" /><path d="M7 9V6a3 3 0 0 1 6 0v3" />
                </svg>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" className="inp-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label="Mostrar senha">
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10C4 6 7 4 10 4s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6z"/><circle cx="10" cy="10" r="2.5"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Entrando…' : (
                <>
                  Acessar painel
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10H16M12 6l4 4-4 4" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="fp-foot">
          <span onClick={() => setLegal('termos')}>Termos de uso</span>
          <span onClick={() => setLegal('privacidade')}>Privacidade</span>
          <span>Suporte</span>
        </div>
      </section>

      <LegalModal type={legal} onClose={() => setLegal(null)} />
    </div>
  )
}
