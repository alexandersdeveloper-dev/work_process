// Processes (data table) screen

const { SIGA_PROCESSES } = window.SIGA;

function ProcessesScreen({ goToDetail }) {
  const [tab, setTab] = React.useState("todos");
  const [selected, setSelected] = React.useState(new Set());

  const tabs = [
    { id: "todos",      label: "Todos",            count: 4218 },
    { id: "meus",       label: "Meus processos",   count: 42 },
    { id: "aguardando", label: "Aguardando ação",  count: 14 },
    { id: "atraso",     label: "Em atraso",        count: 7 },
    { id: "concluidos", label: "Concluídos",       count: 1892 },
  ];

  const rows = SIGA_PROCESSES;

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
  };
  const toggle = id => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="display">Processos</h1>
          <div className="sub">
            Gerencie protocolos, pareceres e encaminhamentos. Filtros e seleção múltipla disponíveis.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn"><Icon name="download" /> Exportar</button>
          <button className="btn primary"><Icon name="plus" /> Novo protocolo</button>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {tabs.map(t => (
            <div key={t.id}
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}>
              {t.label}
              <span className="c tnum">{t.count.toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>

        <div className="filters">
          <button className="btn sm"><Icon name="filter" /> Filtros</button>
          <div className="chip"><span className="k">Unidade:</span> Meio Ambiente <span className="x">×</span></div>
          <div className="chip"><span className="k">Período:</span> Últimos 30 dias <span className="x">×</span></div>
          <div className="chip"><span className="k">Status:</span> Em análise, Aguardando <span className="x">×</span></div>
          <button className="btn ghost sm">Limpar filtros</button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {selected.size > 0 ? (
              <span><strong style={{ color: "var(--ink)" }}>{selected.size}</strong> selecionados</span>
            ) : (
              <span>Exibindo <strong style={{ color: "var(--ink)" }} className="tnum">1–10</strong> de <strong style={{ color: "var(--ink)" }} className="tnum">4.218</strong></span>
            )}
          </div>
        </div>

        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox"
                    checked={selected.size === rows.length}
                    onChange={toggleAll}
                    style={{ accentColor: "var(--ink)" }}
                  />
                </th>
                <th style={{ width: 180 }}>Protocolo</th>
                <th>Assunto</th>
                <th>Unidade</th>
                <th>Situação</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Progresso</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => goToDetail(r.id)}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      style={{ accentColor: "var(--ink)" }}
                    />
                  </td>
                  <td><span className="id">{r.id}</span></td>
                  <td className="title">{r.title}</td>
                  <td className="muted">{r.dept}</td>
                  <td><span className={`pill ${r.statusKind}`}><span className="d" />{r.status}</span></td>
                  <td className="muted">{r.responsavel}</td>
                  <td className="muted mono" style={{ fontSize: 12 }}>{r.prazo}</td>
                  <td style={{ width: 140 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="bar" style={{ flex: 1 }}>
                        <span style={{
                          width: r.progresso + "%",
                          background: r.statusKind === "danger" ? "var(--danger)" :
                                      r.statusKind === "success" ? "var(--success)" : "var(--ink)"
                        }} />
                      </div>
                      <span className="mono tnum" style={{ fontSize: 11, color: "var(--muted)", width: 26, textAlign: "right" }}>
                        {r.progresso}%
                      </span>
                    </div>
                  </td>
                  <td className="num">{r.num}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn ghost sm" aria-label="Mais"><Icon name="more" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div>Exibir <span className="mono tnum">10</span> por página</div>
          <div className="pages">
            <button className="page"><Icon name="chevronL" /></button>
            <button className="page active">1</button>
            <button className="page">2</button>
            <button className="page">3</button>
            <button className="page">…</button>
            <button className="page">422</button>
            <button className="page"><Icon name="chevron" /></button>
          </div>
        </div>
      </div>
    </>
  );
}

window.ProcessesScreen = ProcessesScreen;
