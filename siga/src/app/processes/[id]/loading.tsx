export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div className="skel" style={{ width: 72, height: 22, borderRadius: 20 }} />
            <div className="skel" style={{ width: 60, height: 22, borderRadius: 20 }} />
          </div>
          <div className="skel" style={{ width: 240, height: 24, marginBottom: 8 }} />
          <div className="skel" style={{ width: 180, height: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skel" style={{ width: 130, height: 32, borderRadius: 4 }} />
          <div className="skel" style={{ width: 72, height: 32, borderRadius: 4 }} />
          <div className="skel" style={{ width: 72, height: 32, borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Informações */}
        <div className="card">
          <div className="card-h">
            <div className="skel" style={{ width: 100, height: 16 }} />
            <div className="skel" style={{ width: 14, height: 14 }} />
          </div>
          <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[160, 200, 140, 120, 150].map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--line-2)' }}>
                <div className="skel" style={{ width: 100, height: 14 }} />
                <div className="skel" style={{ width: w, height: 14 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Trilha */}
        <div className="card">
          <div className="card-h">
            <div className="skel" style={{ width: 130, height: 16 }} />
            <div className="skel" style={{ width: 50, height: 14 }} />
          </div>
          <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skel" style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skel" style={{ width: '60%', height: 14 }} />
                  <div className="skel" style={{ width: '40%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
