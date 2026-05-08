export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 100, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 180, height: 14 }} />
        </div>
        <div className="skel" style={{ width: 130, height: 34, borderRadius: 6 }} />
      </div>
      <div className="card">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12 }}>
          {[120, 80, 70].map((w, i) => (
            <div key={i} className="skel" style={{ width: w, height: 14 }} />
          ))}
        </div>
        <div style={{ padding: '8px 0' }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--line)' }}>
              <div className="skel" style={{ flex: 2, height: 14 }} />
              <div className="skel" style={{ flex: 1, height: 14 }} />
              <div className="skel" style={{ width: 60, height: 22, borderRadius: 20 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <div className="skel" style={{ width: 52, height: 28, borderRadius: 4 }} />
                <div className="skel" style={{ width: 52, height: 28, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
