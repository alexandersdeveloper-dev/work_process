export const queryKeys = {
  // --- Auth/users ---
  profiles: () => ['profiles'] as const,

  // --- Processes ---
  processes: (userId: string, role: string) => ['processes', userId, role] as const,
  processesFiltered: (userId: string, role: string, filters: Record<string, string>) =>
    ['processes', userId, role, filters] as const,
  process: (id: string) => ['process', id] as const,
  steps: (processId: string) => ['steps', processId] as const,
  processShares: (processId: string) => ['process-shares', processId] as const,
  sharedProcesses: (userId: string) => ['shared-processes', userId] as const,
  allProcesses: () => ['all-processes'] as const,

  // --- Comunicados ---
  comunicados: (userId: string, role: string) => ['comunicados', userId, role] as const,

  // --- Calendário ---
  folgas: (userId: string, role: string) => ['folgas', userId, role] as const,
  deadlines: (userId: string, role: string) => ['deadlines', userId, role] as const,

  // --- Feriados ---
  feriados: () => ['feriados'] as const,

  // --- Unidade ---
  unidade: (userId: string) => ['unidade', userId] as const,

  // --- Configurações ---
  configuracoes: (userId: string) => ['configuracoes', userId] as const,
  processTypes: (userId: string) => ['process-types', userId] as const,
  stepTypes: (userId: string) => ['step-types', userId] as const,

  // --- Kanban ---
  kanbanCards: (userId: string) => ['kanban-cards', userId] as const,
  kanbanShares: (cardId: string) => ['kanban-shares', cardId] as const,
}
