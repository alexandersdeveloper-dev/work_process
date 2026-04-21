// Process detail screen

const { SIGA_TIMELINE } = window.SIGA;

function DetailScreen({ recordId, back }) {
  const rec = (window.SIGA.SIGA_PROCESSES.find(p => p.id === recordId)) || window.SIGA.SIGA_PROCESSES[0];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <button className="btn ghost sm" onClick={back}>
          <Icon name="chevronL" /> Voltar para Processos
        </button>
      </div>
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{rec.id}</span>
            <span className={`pill ${rec.statusKind}`}><span className="d" />{rec.status}</span>
            <span className="pill"><Icon name="flag" size={11} />Prioridade alta</span>
          </div>
          <h1 className="display">{rec.title}</h1>
          <div className="sub">
            Protocolado em 10/04/2026 · Autuação eletrônica por Marina Albuquerque · Secretaria de {rec.dept}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn"><Icon name="print" /></button>
          <button className="btn"><Icon name="download" /></button>
          <button className="btn"><Icon name="edit" /> Editar</button>
          <button className="btn primary"><Icon name="check" /> Assinar parecer</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="card">
            <div className="card-h">
              <h3>Informações do processo</h3>
              <button className="btn ghost sm"><Icon name="edit" /></button>
            </div>
            <div className="card-b" style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div className="field">
                <div className="k">Número SEI</div>
                <div className="v mono">{rec.id}</div>
              </div>
              <div className="field">
                <div className="k">Tipo de processo</div>
                <div className="v">Licenciamento ambiental — Impacto de vizinhança</div>
              </div>
              <div className="field">
                <div className="k">Interessado</div>
                <div className="v">
                  Construtora Horizonte Ltda. <span className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>· CNPJ 12.345.678/0001-90</span>
                </div>
              </div>
              <div className="field">
                <div className="k">Endereço</div>
                <div className="v">Av. Paulista, 2.114 · Bela Vista · São Paulo/SP</div>
              </div>
              <div className="field">
                <div className="k">Unidade responsável</div>
                <div className="v">Secretaria de Meio Ambiente · DL-04</div>
              </div>
              <div className="field">
                <div className="k">Responsável técnico</div>
                <div className="v">{rec.responsavel} · matrícula <span className="mono">487.291</span></div>
              </div>
              <div className="field">
                <div className="k">Valor estimado</div>
                <div className="v mono tnum">{rec.num}</div>
              </div>
              <div className="field">
                <div className="k">Prazo legal</div>
                <div className="v">
                  <span className="mono">{rec.prazo}</span>
                  <span style={{ color: "var(--muted)", marginLeft: 10, fontSize: 12 }}>· 8 dias restantes</span>
                </div>
              </div>
              <div className="field">
                <div className="k">Base legal</div>
                <div className="v">Lei Municipal n.º 13.885/2004, art. 154 · Resolução CONAMA 237/97</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <h3>Documentos anexos</h3>
              <button className="btn sm"><Icon name="upload" /> Anexar</button>
            </div>
            <div className="card-b" style={{ padding: 0 }}>
              <table className="t">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Tipo</th>
                    <th>Assinado por</th>
                    <th>Data</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["001_requerimento_inicial.pdf", "Requerimento", "Construtora Horizonte", "10/04/2026"],
                    ["002_memorial_descritivo.pdf", "Memorial", "Eng. Paulo Vieira — CREA 128.442", "10/04/2026"],
                    ["003_relatorio_fotografico.pdf", "Relatório", "Marina Albuquerque", "13/04/2026"],
                    ["004_planta_implantacao.dwg", "Planta", "—", "13/04/2026"],
                    ["005_parecer_tecnico_rascunho.docx", "Parecer", "— (em elaboração)", "16/04/2026"],
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="title">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <Icon name="file" /> <span>{row[0]}</span>
                        </span>
                      </td>
                      <td className="muted">{row[1]}</td>
                      <td className="muted">{row[2]}</td>
                      <td className="muted mono" style={{ fontSize: 12 }}>{row[3]}</td>
                      <td><button className="btn ghost sm"><Icon name="download" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <h3>Comentários internos</h3>
              <span className="sub">4 observações</span>
            </div>
            <div className="card-b">
              {[
                { who: "Carlos Mendonça", role: "Chefe DL-04", t: "há 2 dias", m: "Favor verificar a distância mínima ao patrimônio tombado (40m conforme tombamento CONPRESP) antes de emitir parecer favorável." },
                { who: "Marina Albuquerque", role: "Analista", t: "há 1 dia", m: "Confirmado em vistoria: distância de 62m. Documentação fotográfica anexada (doc. 003)." },
              ].map((c, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "36px 1fr", gap: 14,
                  padding: "14px 0",
                  borderBottom: i === 0 ? "1px solid var(--line-2)" : "none"
                }}>
                  <div className="sb-avatar" style={{ width: 36, height: 36 }}>{c.who.split(" ").map(w => w[0]).slice(0,2).join("")}</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{c.who}</strong>
                      <span style={{ color: "var(--muted)", fontSize: 11.5 }}>{c.role}</span>
                      <span style={{ color: "var(--muted-2)", fontSize: 11.5, marginLeft: "auto" }}>{c.t}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{c.m}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <input type="text" placeholder="Adicionar comentário interno…"
                  style={{
                    flex: 1, border: "1px solid var(--line)",
                    background: "var(--bg)", padding: "10px 12px",
                    font: "inherit", fontSize: 13, outline: "none"
                  }}
                />
                <button className="btn">Enviar</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="card">
            <div className="card-h">
              <h3>Tramitação</h3>
              <span className="sub">{SIGA_TIMELINE.filter(t => t.state === "done").length} de {SIGA_TIMELINE.length}</span>
            </div>
            <div className="card-b">
              <div className="timeline">
                {SIGA_TIMELINE.map((s, i) => (
                  <div className="tl-item" key={i}>
                    <div className={`tl-mark ${s.state}`}>
                      {s.state === "done" && <Icon name="check" size={12} />}
                      {s.state === "current" && <span style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: "50%" }} />}
                      {s.state === "pending" && <span style={{ width: 6, height: 6, background: "var(--muted-2)", borderRadius: "50%" }} />}
                    </div>
                    <div className="tl-body">
                      <div className="t">{s.title}</div>
                      <div className="m">{s.meta}</div>
                      {s.desc && <div className="d">{s.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Partes envolvidas</h3></div>
            <div className="card-b" style={{ paddingTop: 8, paddingBottom: 8 }}>
              {[
                ["Construtora Horizonte Ltda.", "Interessado", "CNPJ 12.345.678/0001-90"],
                ["Paulo Vieira", "Responsável técnico", "CREA 128.442"],
                ["Marina Albuquerque", "Analista designada", "Matrícula 487.291"],
                ["Carlos Mendonça", "Chefia", "DL-04"],
              ].map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: i === 3 ? "none" : "1px solid var(--line-2)"
                }}>
                  <div className="sb-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                    {p[0].split(" ").map(w => w[0]).slice(0,2).join("")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p[0]}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{p[1]} · <span className="mono">{p[2]}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Metadados</h3></div>
            <div className="card-b" style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div className="field" style={{ gridTemplateColumns: "120px 1fr", padding: "10px 0" }}>
                <div className="k">Criado</div>
                <div className="v mono" style={{ fontSize: 12 }}>2026-04-10 09:12:47</div>
              </div>
              <div className="field" style={{ gridTemplateColumns: "120px 1fr", padding: "10px 0" }}>
                <div className="k">Modificado</div>
                <div className="v mono" style={{ fontSize: 12 }}>2026-04-19 17:04:02</div>
              </div>
              <div className="field" style={{ gridTemplateColumns: "120px 1fr", padding: "10px 0" }}>
                <div className="k">Hash SHA-256</div>
                <div className="v mono" style={{ fontSize: 11 }}>9f2d…a74c</div>
              </div>
              <div className="field" style={{ gridTemplateColumns: "120px 1fr", padding: "10px 0" }}>
                <div className="k">Visibilidade</div>
                <div className="v">Pública · disponível no portal de transparência</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.DetailScreen = DetailScreen;
