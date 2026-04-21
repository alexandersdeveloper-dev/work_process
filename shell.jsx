// Sidebar, Topbar, and Tweaks panel for SIGA

function Sidebar({ route, setRoute, collapsed }) {
  const nav = [
    {
      group: "Principal",
      items: [
        { id: "dashboard", label: "Painel geral", icon: "home" },
        { id: "processos", label: "Processos",    icon: "layers", badge: "128" },
        { id: "cidadaos",  label: "Cidadãos",     icon: "users" },
        { id: "documentos",label: "Documentos",   icon: "file" },
      ]
    },
    {
      group: "Gestão",
      items: [
        { id: "relatorios",label: "Relatórios",   icon: "chart" },
        { id: "unidades",  label: "Unidades",     icon: "building" },
        { id: "protocolos",label: "Protocolos",   icon: "inbox",  badge: "7" },
        { id: "arquivo",   label: "Arquivo",      icon: "archive" },
      ]
    },
    {
      group: "Sistema",
      items: [
        { id: "auditoria", label: "Auditoria",    icon: "shield" },
        { id: "config",    label: "Configurações",icon: "settings" },
      ]
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-mark">S</div>
        <div className="sb-brand-text">
          <div className="t1">SIGA</div>
          <div className="t2">Gestão Integrada</div>
        </div>
      </div>
      <nav className="sb-nav">
        {nav.map(g => (
          <div key={g.group}>
            <div className="sb-group-label">{g.group}</div>
            {g.items.map(it => (
              <div
                key={it.id}
                className={`sb-item ${route === it.id ? "active" : ""}`}
                onClick={() => setRoute(it.id)}
                title={it.label}
              >
                <Icon name={it.icon} />
                <span>{it.label}</span>
                {it.badge && <span className="sb-badge">{it.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="sb-avatar">MA</div>
        <div className="who">
          <div className="n">Marina Albuquerque</div>
          <div className="r">Analista · DL-04</div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ route, setRoute, onToggleSidebar, recordId }) {
  const crumbs = (() => {
    const map = {
      dashboard:  ["Início", "Painel geral"],
      processos:  ["Início", "Processos"],
      detail:     ["Início", "Processos", recordId || "—"],
      cidadaos:   ["Início", "Cidadãos"],
      documentos: ["Início", "Documentos"],
      relatorios: ["Início", "Relatórios"],
      unidades:   ["Início", "Unidades"],
      protocolos: ["Início", "Protocolos"],
      arquivo:    ["Início", "Arquivo"],
      auditoria:  ["Início", "Auditoria"],
      config:     ["Início", "Configurações"],
    };
    return map[route] || ["Início"];
  })();

  return (
    <header className="topbar">
      <button className="iconbtn" onClick={onToggleSidebar} title="Alternar menu" aria-label="Menu">
        <Icon name="panel" />
      </button>
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "cur" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="spacer" />
      <div className="search">
        <Icon name="search" className="ico" />
        <input type="text" placeholder="Buscar processo, cidadão, documento…" />
        <span className="kbd">⌘K</span>
      </div>
      <button className="iconbtn" title="Notificações" aria-label="Notificações">
        <Icon name="bell" />
        <span className="dot" />
      </button>
      <button className="iconbtn" title="Ajuda" aria-label="Ajuda">
        <Icon name="book" />
      </button>
    </header>
  );
}

function Tweaks({ open, setOpen, theme, setTheme, density, setDensity, accent, setAccent, sidebar, setSidebar }) {
  if (!open) {
    return (
      <div className="tweaks-toggle">
        <button className="btn" onClick={() => setOpen(true)}>
          <Icon name="sparkle" /> Tweaks
        </button>
      </div>
    );
  }
  const accents = [
    { id: "terracotta", color: "#9a3412" },
    { id: "government", color: "#1e3a8a" },
    { id: "moss",       color: "#3f6212" },
    { id: "ink",        color: "#1c1917" },
  ];
  return (
    <div className="tweaks">
      <div className="tweaks-h">
        <span>Tweaks</span>
        <button className="btn ghost sm" onClick={() => setOpen(false)}>
          <Icon name="x" />
        </button>
      </div>
      <div className="tweaks-b">
        <div className="tw-row">
          <div className="lbl">Tema</div>
          <div className="seg">
            <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>Claro</button>
            <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>Escuro</button>
          </div>
        </div>
        <div className="tw-row">
          <div className="lbl">Densidade</div>
          <div className="seg">
            <button className={density === "compact" ? "on" : ""} onClick={() => setDensity("compact")}>Compacta</button>
            <button className={density === "balanced" ? "on" : ""} onClick={() => setDensity("balanced")}>Padrão</button>
            <button className={density === "comfortable" ? "on" : ""} onClick={() => setDensity("comfortable")}>Ampla</button>
          </div>
        </div>
        <div className="tw-row">
          <div className="lbl">Acento</div>
          <div className="swatches">
            {accents.map(a => (
              <div key={a.id}
                className={`sw ${accent === a.id ? "on" : ""}`}
                style={{ background: a.color }}
                onClick={() => setAccent(a.id)}
                title={a.id}
              />
            ))}
          </div>
        </div>
        <div className="tw-row">
          <div className="lbl">Menu lateral</div>
          <div className="seg">
            <button className={sidebar === "expanded" ? "on" : ""} onClick={() => setSidebar("expanded")}>Expandido</button>
            <button className={sidebar === "collapsed" ? "on" : ""} onClick={() => setSidebar("collapsed")}>Recolhido</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, Tweaks });
