// Mock data for SIGA admin panel (fictional municipal system)

const SIGA_KPIS = [
  { label: "Processos ativos", val: "4.218", trend: "+3,2%", dir: "up", hint: "vs. mês anterior" },
  { label: "Cidadãos atendidos", val: "12.094", trend: "+8,1%", dir: "up", hint: "neste mês" },
  { label: "Prazo médio", val: "11,4", unit: "dias", trend: "−1,8 d", dir: "up", hint: "meta: 14 dias" },
  { label: "Pendências críticas", val: "37", trend: "+6", dir: "down", hint: "requerem ação" },
];

const SIGA_PROCESSES = [
  { id: "SEI-2026.0412.0087", title: "Licenciamento ambiental — Obras Av. Paulista", dept: "Meio Ambiente", status: "Em análise", statusKind: "info", responsavel: "Marina Albuquerque", prazo: "28/04/2026", progresso: 62, num: "R$ 148.900,00" },
  { id: "SEI-2026.0411.0213", title: "Contratação direta — Serviços de manutenção predial", dept: "Administração", status: "Aguardando parecer", statusKind: "warning", responsavel: "Ricardo Tavares", prazo: "22/04/2026", progresso: 41, num: "R$ 92.400,00" },
  { id: "SEI-2026.0410.0156", title: "Auxílio emergencial — Famílias Zona Leste", dept: "Assistência Social", status: "Aprovado", statusKind: "success", responsavel: "Joana Ribeiro", prazo: "20/04/2026", progresso: 100, num: "R$ 312.500,00" },
  { id: "SEI-2026.0409.0088", title: "Reforma EMEF Pe. Anchieta — etapa 2", dept: "Educação", status: "Em execução", statusKind: "info", responsavel: "Carlos Mendonça", prazo: "30/05/2026", progresso: 74, num: "R$ 1.204.380,00" },
  { id: "SEI-2026.0408.0342", title: "Recapeamento asfáltico — Bairro Santo Antônio", dept: "Obras", status: "Em atraso", statusKind: "danger", responsavel: "Luciana Prado", prazo: "15/04/2026", progresso: 58, num: "R$ 487.100,00" },
  { id: "SEI-2026.0408.0301", title: "Convênio Saúde — UBS Vila Nova", dept: "Saúde", status: "Aprovado", statusKind: "success", responsavel: "Fernando Queiroz", prazo: "18/04/2026", progresso: 100, num: "R$ 215.000,00" },
  { id: "SEI-2026.0407.0259", title: "Aquisição de mobiliário escolar", dept: "Educação", status: "Em análise", statusKind: "info", responsavel: "Marina Albuquerque", prazo: "01/05/2026", progresso: 33, num: "R$ 78.600,00" },
  { id: "SEI-2026.0407.0114", title: "Atualização cadastral — Sistema Tributário", dept: "Fazenda", status: "Aguardando parecer", statusKind: "warning", responsavel: "André Nogueira", prazo: "24/04/2026", progresso: 28, num: "—" },
  { id: "SEI-2026.0405.0067", title: "Capacitação de servidores — LGPD", dept: "RH", status: "Em execução", statusKind: "info", responsavel: "Patrícia Lobo", prazo: "30/04/2026", progresso: 81, num: "R$ 24.800,00" },
  { id: "SEI-2026.0404.0421", title: "Sindicância disciplinar — Protocolo 2026/112", dept: "Corregedoria", status: "Sigiloso", statusKind: "danger", responsavel: "—", prazo: "—", progresso: 15, num: "—" },
];

const SIGA_ACTIVITY = [
  { kind: "accent", who: "Marina Albuquerque", what: "assinou digitalmente o parecer técnico do processo", ref: "SEI-2026.0412.0087", when: "há 4 min" },
  { kind: "success", who: "Joana Ribeiro", what: "aprovou a liberação do", ref: "Auxílio Emergencial Lote 47", when: "há 22 min" },
  { kind: "default", who: "Ricardo Tavares", what: "anexou 3 documentos ao processo", ref: "SEI-2026.0411.0213", when: "há 1 h" },
  { kind: "warning", who: "Sistema", what: "sinalizou vencimento de prazo em", ref: "12 processos", when: "há 2 h" },
  { kind: "default", who: "Carlos Mendonça", what: "atualizou o cronograma da", ref: "Reforma EMEF Pe. Anchieta", when: "há 3 h" },
  { kind: "default", who: "Fernando Queiroz", what: "protocolou o convênio", ref: "SEI-2026.0408.0301", when: "ontem, 16:42" },
];

const SIGA_CHART = {
  // protocolos abertos vs. concluídos, por mês
  months: ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr"],
  abertos:    [312, 289, 341, 378, 402, 418],
  concluidos: [287, 301, 322, 355, 376, 394],
};

const SIGA_DEPT_LOAD = [
  { name: "Educação",          pct: 82, count: 412 },
  { name: "Saúde",             pct: 71, count: 358 },
  { name: "Obras",             pct: 64, count: 298 },
  { name: "Assistência Social",pct: 48, count: 224 },
  { name: "Administração",     pct: 39, count: 186 },
  { name: "Meio Ambiente",     pct: 28, count: 132 },
];

const SIGA_TIMELINE = [
  { state: "done", title: "Protocolo aberto", meta: "10/04/2026 · 09:12", desc: "Processo autuado por Marina Albuquerque no setor de Meio Ambiente." },
  { state: "done", title: "Distribuição", meta: "10/04/2026 · 11:30", desc: "Distribuído à Divisão de Licenciamento (DL-04)." },
  { state: "done", title: "Vistoria técnica", meta: "13/04/2026 · 14:00", desc: "Realizada vistoria no local. Relatório fotográfico anexado (12 arquivos)." },
  { state: "current", title: "Parecer técnico em elaboração", meta: "em andamento · desde 16/04/2026", desc: "Responsável técnico redigindo parecer com observações sobre impacto de vizinhança." },
  { state: "pending", title: "Assinatura da chefia", meta: "previsto para 24/04/2026", desc: "" },
  { state: "pending", title: "Emissão de licença", meta: "previsto para 28/04/2026", desc: "" },
];

window.SIGA = { SIGA_KPIS, SIGA_PROCESSES, SIGA_ACTIVITY, SIGA_CHART, SIGA_DEPT_LOAD, SIGA_TIMELINE };
