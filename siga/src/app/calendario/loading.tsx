export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 110, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 200, height: 14 }} />
        </div>
        <div className="skel" style={{ width: 140, height: 34, borderRadius: 6 }} />
      </div>

      <div className="cal-layout">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="card">
            {/* Nav mês */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
              <div className="skel" style={{ width: 32, height: 32, borderRadius: 4 }} />
              <div className="skel" style={{ width: 140, height: 18, borderRadius: 4 }} />
              <div className="skel" style={{ width: 32, height: 32, borderRadius: 4 }} />
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
              {/* Cabeçalho dias da semana */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8, gap: 4 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="skel" style={{ height: 14, borderRadius: 3 }} />
                ))}
              </div>

              {/* Grid de dias */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="skel" style={{ height: 96, borderRadius: 6 }} />
                ))}
              </div>
            </div>

            {/* Legenda + botão PDF */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="skel" style={{ width: 10, height: 10, borderRadius: 2 }} />
                    <div className="skel" style={{ width: 36, height: 11, borderRadius: 3 }} />
                  </div>
                ))}
              </div>
              <div className="skel" style={{ width: 60, height: 28, borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
