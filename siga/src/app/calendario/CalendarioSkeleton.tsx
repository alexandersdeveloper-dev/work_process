// Rows with events: sparse, realistic distribution (≈ 1 in 5 days)
const EVENT_ROWS: Record<number, { widths: string[] }> = {
  2:  { widths: ['75%'] },
  5:  { widths: ['85%', '50%'] },
  9:  { widths: ['60%'] },
  12: { widths: ['80%'] },
}

export default function CalendarioSkeleton() {
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

            {/* ── Mobile: agenda list ── */}
            <div className="cal-skel-mobile" style={{ padding: '4px 16px 16px' }}>
              {Array.from({ length: 15 }).map((_, i) => {
                const events = EVENT_ROWS[i]?.widths ?? []
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
                    {/* Date column */}
                    <div style={{ width: 38, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, paddingTop: 2 }}>
                      <div className="skel" style={{ width: 24, height: 20, borderRadius: 3 }} />
                      <div className="skel" style={{ width: 20, height: 10, borderRadius: 2 }} />
                    </div>
                    {/* Events column */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                      {events.map((w, j) => (
                        <div key={j} className="skel" style={{ height: 28, borderRadius: 4, width: w }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Desktop: 7-column grid ── */}
            <div className="cal-skel-desktop" style={{ padding: '16px 20px 20px' }}>
              {/* Weekday headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8, gap: 4 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="skel" style={{ height: 14, borderRadius: 3 }} />
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="skel" style={{ height: 96, borderRadius: 6 }} />
                ))}
              </div>
            </div>

            {/* Legenda + PDF */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
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
