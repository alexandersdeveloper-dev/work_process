// Dashboard screen — KPIs, chart, activity, department load

const { SIGA_KPIS, SIGA_ACTIVITY, SIGA_CHART, SIGA_DEPT_LOAD } = window.SIGA;

function Sparkline({ vals, w = 80, h = 24, accent = false }) {
  const max = Math.max(...vals), min = Math.min(...vals);
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="spark">
      <polyline points={pts} fill="none"
        stroke={accent ? "var(--accent)" : "var(--ink-2)"} strokeWidth="1.25" />
    </svg>
  );
}

function Chart() {
  const { months, abertos, concluidos } = SIGA_CHART;
  const W = 640, H = 220, padL = 36, padR = 16, padT = 16, padB = 28;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const allVals = [...abertos, ...concluidos];
  const maxY = Math.ceil(Math.max(...allVals) / 100) * 100;
  const minY = 200;
  const xs = months.map((_, i) => padL + (i / (months.length - 1)) * innerW);
  const yScale = v => padT + innerH - ((v - minY) / (maxY - minY)) * innerH;
  const linePath = vs => vs.map((v, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${yScale(v)}`).join(" ");
  const areaPath = vs => linePath(vs) + ` L ${xs[xs.length - 1]} ${padT + innerH} L ${xs[0]} ${padT + innerH} Z`;
  const ticks = [minY, minY + (maxY - minY) / 2, maxY];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {ticks.map((t, i) => (
        <g key={i}>
          <line className="grid-line" x1={padL} x2={W - padR} y1={yScale(t)} y2={yScale(t)} />
          <text className="axis" x={padL - 8} y={yScale(t) + 3} textAnchor="end">{t}</text>
        </g>
      ))}
      {months.map((m, i) => (
        <text key={m} className="axis" x={xs[i]} y={H - 8} textAnchor="middle">{m}</text>
      ))}
      <path className="area" d={areaPath(abertos)} />
      <path className="line" d={linePath(abertos)} />
      <path className="line accent" d={linePath(concluidos)} />
      {abertos.map((v, i) => (
        <circle key={"a" + i} className="dot" cx={xs[i]} cy={yScale(v)} r="3" />
      ))}
    </svg>
  );
}

function DashboardScreen({ goToProcesses, goToDetail }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="display">Painel geral</h1>
          <div className="sub">
            Visão consolidada dos protocolos, prazos e movimentações da Secretaria.
          </div>
        </div>
        <div className="meta">
          <div><span className="k">Referência</span> &nbsp; Abril / 2026</div>
          <div><span className="k">Atualizado</span> &nbsp; 20/04/2026 · 14:32</div>
          <div><span className="k">Fonte</span> &nbsp; SEI · SIGRH · SIORG</div>
        </div>
      </div>

      <div className="kpis">
        {SIGA_KPIS.map((k, i) => (
          <div className="kpi" key={i}>
            <div className="label">{k.label}</div>
            <div className="val">
              {k.val}{k.unit && <span className="unit">&nbsp;{k.unit}</span>}
            </div>
            <div className="trend">
              <span className={k.dir === "up" ? "up" : "down"}>{k.trend}</span>
              <span>·</span>
              <span>{k.hint}</span>
            </div>
            <Sparkline vals={[3,5,4,6,5,7,6,8,7,9, i === 3 ? 6 : 10]} accent={i === 0} />
          </div>
        ))}
      </div>

      <div className="grid two" style={{ marginBottom: 22 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Movimentação de protocolos</h3>
              <div className="sub">Últimos 6 meses · abertos vs. concluídos</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 1.5, background: "var(--ink)" }} /> Abertos
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 1.5, background: "var(--accent)",
                  borderTop: "1.5px dashed var(--accent)" }} /> Concluídos
              </span>
            </div>
          </div>
          <div className="card-b"><Chart /></div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Atividade recente</h3>
            <button className="btn ghost sm">Ver tudo <Icon name="chevron" /></button>
          </div>
          <div className="card-b" style={{ paddingTop: 4, paddingBottom: 4 }}>
            {SIGA_ACTIVITY.map((a, i) => (
              <div className="act-item" key={i}>
                <div className={`act-dot ${a.kind !== "default" ? a.kind : ""}`} />
                <div className="act-body">
                  <div className="t">
                    <strong>{a.who}</strong> {a.what} <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{a.ref}</span>
                  </div>
                </div>
                <div className="act-time">{a.when}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Carga por unidade</h3>
              <div className="sub">Processos ativos distribuídos entre secretarias</div>
            </div>
          </div>
          <div className="card-b">
            {SIGA_DEPT_LOAD.map((d, i) => (
              <div key={d.name} style={{
                display: "grid", gridTemplateColumns: "160px 1fr 60px",
                gap: 16, alignItems: "center",
                padding: "10px 0",
                borderBottom: i === SIGA_DEPT_LOAD.length - 1 ? "none" : "1px solid var(--line-2)"
              }}>
                <div style={{ fontSize: 13 }}>{d.name}</div>
                <div className="bar"><span style={{ width: d.pct + "%" }} /></div>
                <div className="mono tnum" style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>
                  {d.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <h3>Ações rápidas</h3>
          </div>
          <div className="card-b" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--line)", margin: -20, padding: 0 }}>
            {[
              { ico: "plus", t: "Abrir novo protocolo", s: "Formulário SEI padrão" },
              { ico: "upload", t: "Importar documentos", s: "PDF, DOCX, imagens" },
              { ico: "chart", t: "Gerar relatório", s: "Com modelo institucional" },
              { ico: "users", t: "Cadastrar cidadão", s: "CPF ou CNPJ" },
            ].map((a, i) => (
              <button key={i} style={{
                background: "var(--panel)", border: "none",
                padding: "20px 18px", textAlign: "left",
                display: "flex", alignItems: "flex-start", gap: 12,
                cursor: "pointer"
              }} onMouseEnter={e => e.currentTarget.style.background = "var(--panel-alt)"}
                 onMouseLeave={e => e.currentTarget.style.background = "var(--panel)"}>
                <div style={{
                  width: 32, height: 32,
                  border: "1px solid var(--line)",
                  display: "grid", placeItems: "center",
                  color: "var(--ink-2)", flexShrink: 0
                }}>
                  <Icon name={a.ico} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.t}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{a.s}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

window.DashboardScreen = DashboardScreen;
