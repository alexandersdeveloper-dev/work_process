export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 140, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 220, height: 14 }} />
        </div>
      </div>
      <div className="kpis">
        {[1,2,3,4].map((i) => (
          <div key={i} className="kpi">
            <div className="skel" style={{ width: 60, height: 13, marginBottom: 10 }} />
            <div className="skel" style={{ width: 40, height: 32, marginBottom: 6 }} />
            <div className="skel" style={{ width: 90, height: 12 }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-h">
          <div className="skel" style={{ width: 140, height: 16 }} />
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} className="skel" style={{ width: '100%', height: 36 }} />
          ))}
        </div>
      </div>
    </>
  )
}
