export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 100, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 180, height: 14 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }} className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <div className="skel" style={{ width: 32, height: 32, borderRadius: 4 }} />
            <div className="skel" style={{ width: 140, height: 18 }} />
            <div className="skel" style={{ width: 32, height: 32, borderRadius: 4 }} />
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8, gap: 4 }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skel" style={{ height: 14, borderRadius: 3 }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="skel" style={{ height: 60, borderRadius: 6 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
