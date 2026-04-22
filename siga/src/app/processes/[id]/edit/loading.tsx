export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 160, height: 24, marginBottom: 8 }} />
          <div className="skel" style={{ width: 120, height: 14 }} />
        </div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skel" style={{ width: 80, height: 13 }} />
              <div className="skel" style={{ width: '100%', height: 36, borderRadius: 4 }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 16 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skel" style={{ width: 60, height: 13 }} />
                <div className="skel" style={{ width: '100%', height: 36, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[1, 2].map((i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skel" style={{ width: 70, height: 13 }} />
                <div className="skel" style={{ width: '100%', height: 36, borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <div className="skel" style={{ width: 130, height: 36, borderRadius: 4 }} />
            <div className="skel" style={{ width: 80, height: 36, borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </>
  )
}
