export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 100, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 240, height: 14 }} />
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="skel" style={{ width: 80, height: 28, borderRadius: 4 }} />
          ))}
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="skel" style={{ width: '100%', height: 36 }} />
          ))}
        </div>
      </div>
    </>
  )
}
