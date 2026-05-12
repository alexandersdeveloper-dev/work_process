function CardSkel() {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* meta: tipo pill + fonte + data */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="skel" style={{ height: 20, width: 96, borderRadius: 3 }} />
        <div className="skel" style={{ height: 14, width: 120 }} />
        <div className="skel" style={{ height: 14, width: 80 }} />
      </div>

      {/* título */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skel" style={{ height: 16, width: '90%' }} />
        <div className="skel" style={{ height: 16, width: '65%' }} />
      </div>

      {/* objetivo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div className="skel" style={{ height: 13, width: '100%' }} />
        <div className="skel" style={{ height: 13, width: '85%' }} />
        <div className="skel" style={{ height: 13, width: '55%' }} />
      </div>

      {/* rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 2 }}>
        <div className="skel" style={{ height: 12, width: 160 }} />
        <div className="skel" style={{ height: 28, width: 80, borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ensino</h1>
          <p className="sub">Leis, Decretos, Instruções Normativas e demais referências</p>
        </div>
      </div>

      {/* barra de filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="skel" style={{ flex: 1, minWidth: 200, height: 38, borderRadius: 4 }} />
        <div className="skel" style={{ width: 200, height: 38, borderRadius: 4 }} />
      </div>

      {/* cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CardSkel />
        <CardSkel />
        <CardSkel />
      </div>
    </>
  )
}
