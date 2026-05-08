export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 200, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 260, height: 14 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div className="skel" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="skel" style={{ width: 70, height: 20, borderRadius: 20 }} />
                  <div className="skel" style={{ width: i % 2 === 0 ? 180 : 220, height: 16 }} />
                </div>
                <div className="skel" style={{ width: 160, height: 13 }} />
                <div className="skel" style={{ width: '85%', height: 13 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
