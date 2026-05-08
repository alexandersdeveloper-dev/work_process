export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 200, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 280, height: 14 }} />
        </div>
        <div className="skel" style={{ width: 160, height: 34, borderRadius: 6 }} />
      </div>
      <div className="kpis">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi">
            <div className="skel" style={{ width: 60, height: 13, marginBottom: 10 }} />
            <div className="skel" style={{ width: 40, height: 32, marginBottom: 6 }} />
            <div className="skel" style={{ width: 90, height: 12 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <div className="card-h">
            <div className="skel" style={{ width: 140, height: 16 }} />
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skel" style={{ width: '100%', height: 36 }} />
            ))}
          </div>
        </div>
        <div className="card" style={{ minWidth: 220 }}>
          <div className="card-h">
            <div className="skel" style={{ width: 90, height: 16 }} />
          </div>
          <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                <div className="skel" style={{ flex: 1, height: 14 }} />
                <div className="skel" style={{ width: 32, height: 22, borderRadius: 20 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
