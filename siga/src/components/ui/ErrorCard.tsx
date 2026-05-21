'use client'

interface Props {
  message?: string
  onRetry?: () => void
}

export default function ErrorCard({ message, onRetry }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 48,
      textAlign: 'center',
      minHeight: 320,
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
          Algo deu errado
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 340 }}>
          {message ?? 'Não foi possível carregar esta página. Verifique sua conexão e tente novamente.'}
        </p>
      </div>
      {onRetry && (
        <button className="btn ghost" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}
