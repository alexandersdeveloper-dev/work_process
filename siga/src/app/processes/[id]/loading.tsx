export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 180, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 260, height: 14 }} />
        </div>
      </div>
      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div className="card">
            <div className="card-h"><div className="skel" style={{ width: 100, height: 16 }} /></div>
            <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="skel" style={{ width: '100%', height: 20 }} />
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-h"><div className="skel" style={{ width: 120, height: 16 }} /></div>
            <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map((i) => (
                <div key={i} className="skel" style={{ width: '100%', height: 36 }} />
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div className="skel" style={{ width: 120, height: 16 }} /></div>
          <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skel" style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skel" style={{ width: '70%', height: 14 }} />
                  <div className="skel" style={{ width: '50%', height: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
