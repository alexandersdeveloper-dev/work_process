export const queryKeys = {
  profiles: () => ['profiles'] as const,
  processShares: (processId: string) => ['process-shares', processId] as const,
  feriados: () => ['feriados'] as const,
  folgas: (userId: string, role: string) => ['folgas', userId, role] as const,
  deadlines: (userId: string, role: string) => ['deadlines', userId, role] as const,
}
