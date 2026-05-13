function CardSkel() {
  return (
    <div style={{ background: 'var(--panel)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 170 }}>
      {/* pc-header: status pill + priority pill */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skel" style={{ height: 22, width: 84, borderRadius: 20 }} />
        <div className="skel" style={{ height: 22, width: 60, borderRadius: 20 }} />
      </div>
      {/* pc-body: title (2 lines) + type */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skel" style={{ height: 15, width: '88%' }} />
        <div className="skel" style={{ height: 15, width: '62%' }} />
        <div className="skel" style={{ height: 11, width: '38%', marginTop: 4 }} />
      </div>
      {/* pc-footer: responsible + deadline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--line-2)' }}>
        <div className="skel" style={{ height: 11, width: 88 }} />
        <div className="skel" style={{ height: 11, width: 52 }} />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <>
      {/* Page head: título + subtítulo | toggle de view + botão */}
      <div className="page-head">
        <div>
          <div className="skel" style={{ width: 140, height: 22, marginBottom: 8 }} />
          <div className="skel" style={{ width: 200, height: 14 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <div className="skel" style={{ width: 32, height: 32, borderRadius: 4 }} />
            <div className="skel" style={{ width: 32, height: 32, borderRadius: 4 }} />
          </div>
          <div className="skel" style={{ width: 128, height: 34, borderRadius: 6 }} />
        </div>
      </div>

      <div className="card">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 16px', borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
          {[80, 64, 100, 80, 96].map((w, i) => (
            <div key={i} className="skel" style={{ width: w, height: 28, borderRadius: 4, flexShrink: 0 }} />
          ))}
        </div>

        {/* Barra de busca + ordenação */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
          <div className="skel" style={{ flex: 1, minWidth: 160, height: 36, borderRadius: 6 }} />
          <div className="skel" style={{ width: 148, height: 36, borderRadius: 6 }} />
        </div>

        {/* Desktop: linhas de tabela */}
        <div className="proc-skel-table" style={{ padding: '8px 0' }}>
          {[
            [42, 16, 9, 13, 13, 7],
            [34, 20, 9, 13, 17, 7],
            [50, 14, 9, 13, 9, 5],
            [38, 18, 9, 13, 15, 7],
            [30, 21, 9, 13, 19, 8],
            [46, 15, 9, 13, 12, 5],
          ].map((cols, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '11px 20px' }}>
              {cols.map((pct, j) => (
                <div
                  key={j}
                  className="skel"
                  style={{
                    height: 13,
                    width: `${pct}%`,
                    flexShrink: j === 0 ? 1 : 0,
                    minWidth: j === 0 ? 0 : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile: grid de cards */}
        <div
          className="proc-skel-cards"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--line)' }}
        >
          <CardSkel />
          <CardSkel />
          <CardSkel />
          <CardSkel />
        </div>

        {/* Paginação */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
          <div className="skel" style={{ height: 13, width: 90 }} />
        </div>
      </div>
    </>
  )
}
