// ProcessType e StepType são mantidos para compatibilidade com dados legados,
// mas o sistema aceita strings livres (tipos customizados pelo usuário).
export type ProcessType = string
export type StepType = string

export type ProcessStatus =
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'delayed'
  | 'cancelled'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Process {
  id: string
  title: string
  description: string | null
  type: string
  status: ProcessStatus
  priority: Priority
  responsible: string
  portal_section: string | null
  deadline: string | null
  created_at: string
  updated_at: string
  steps?: Step[]
}

export interface Step {
  id: string
  process_id: string
  title: string
  description: string | null
  step_type: string | null
  performed_by: string | null
  reference_link: string | null
  created_at: string
  updated_at: string | null
}

// Mapa de valores legados (enum keys) → labels legíveis
const LEGACY_PROCESS_TYPES: Record<string, string> = {
  portal_update: 'Atualização de Portal',
  supplier_request: 'Solicitação a Fornecedor',
  microservice: 'Microserviço',
  internal_check: 'Verificação Interna',
  bug_fix: 'Correção de Bug',
  improvement: 'Melhoria',
}

const LEGACY_STEP_TYPES: Record<string, string> = {
  note: 'Nota',
  update: 'Atualização',
  request_sent: 'Solicitação enviada',
  response_received: 'Resposta recebida',
  publish_done: 'Publicação feita',
  verification: 'Verificação',
  bug_reported: 'Bug reportado',
  bug_fixed: 'Bug corrigido',
}

/** Retorna o label legível de um tipo de processo, com fallback para o valor bruto. */
export function getProcessTypeLabel(type: string | null | undefined): string {
  if (!type) return '—'
  return LEGACY_PROCESS_TYPES[type] ?? type
}

/** Retorna o label legível de um tipo de etapa, com fallback para o valor bruto. */
export function getStepTypeLabel(type: string | null | undefined): string {
  if (!type) return ''
  return LEGACY_STEP_TYPES[type] ?? type
}

export const STATUS_LABELS: Record<ProcessStatus, string> = {
  active: 'Ativo',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  delayed: 'Atrasado',
  cancelled: 'Cancelado',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export const STATUS_KIND: Record<ProcessStatus, string> = {
  active: 'info',
  in_progress: 'warning',
  completed: 'success',
  delayed: 'danger',
  cancelled: '',
}

export const PRIORITY_KIND: Record<Priority, string> = {
  low: '',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

// Mantidos por compatibilidade com imports existentes
/** @deprecated use getProcessTypeLabel() */
export const PROCESS_TYPE_LABELS = LEGACY_PROCESS_TYPES
/** @deprecated use getStepTypeLabel() */
export const STEP_TYPE_LABELS = LEGACY_STEP_TYPES
