export default function CalendarioPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Calendário</h1>
          <p className="sub">Visualização por data dos processos</p>
        </div>
      </div>

      <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="var(--muted-2)" strokeWidth="1.2" style={{ marginBottom: 16 }}>
          <rect x="2" y="3" width="12" height="12" rx="1" />
          <path d="M5 1v4M11 1v4M2 7h12" strokeLinecap="round" />
          <path d="M5 10h2M9 10h2M5 12.5h2" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 6 }}>Em construção</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 320, margin: '0 auto' }}>
          A visualização em calendário está sendo desenvolvida e estará disponível em breve.
        </p>
      </div>
    </>
  )
}
