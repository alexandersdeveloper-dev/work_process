/** Utilitários de lógica de negócio para processos — sem dependências React. */

export const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
export const STATUS_ORDER: Record<string, number> = { delayed: 0, in_progress: 1, active: 2, completed: 3 }

/** dd/MMM sem ano — ex: "21/mai" */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/** dd/MMM/aaaa — ex: "21/mai/2025" */
export function formatDateMedium(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** dd de MMMM de aaaa — ex: "21 de maio de 2025" */
export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Classifica um prazo como vencido, próximo (≤7 dias) ou sem urgência. */
export function deadlineKind(iso: string | null | undefined): 'overdue' | 'soon' | null {
  if (!iso) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  if (d < today) return 'overdue'
  const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  return diff <= 7 ? 'soon' : null
}
