export const queryKeys = {
  profiles: () => ['profiles'] as const,
  processShares: (processId: string) => ['process-shares', processId] as const,
  feriados: () => ['feriados'] as const,
}
