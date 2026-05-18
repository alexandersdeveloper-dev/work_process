// ProcessType e StepType são mantidos para compatibilidade com dados legados,
// mas o sistema aceita strings livres (tipos customizados pelo usuário).
export type ProcessType = string
export type StepType = string

export type UserRole = 'admin' | 'chefe' | 'assistente' | 'servidor'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  cargo: string | null
  created_at: string
  updated_at: string
}

export interface ProcessShare {
  id: string
  process_id: string
  shared_with_user_id: string
  shared_by_user_id: string
  step_ids: string[] | null
  created_at: string
  profile?: Profile
}

export type ComunicadoType = 'aviso' | 'comunicado' | 'informativo'

export const COMUNICADO_TYPE_LABELS: Record<ComunicadoType, string> = {
  aviso: 'Aviso',
  comunicado: 'Comunicado',
  informativo: 'Informativo',
}

export interface Comunicado {
  id: string
  title: string
  body: string
  type: ComunicadoType
  target_user_ids: string[] | null
  author_id: string
  created_at: string
  updated_at: string
  author?: Profile
}

export type AusenciaType = 'folga' | 'ferias'

export interface Folga {
  id: string
  user_id: string
  registered_by: string
  date: string
  end_date: string | null
  type: AusenciaType
  description: string | null
  created_at: string
  profile?: Profile
}

export type NotificationType = 'process_shared' | 'new_comunicado' | 'folga_registered' | 'deadline_soon' | 'kanban_shared'
export type NotificationRelatedType = 'process' | 'comunicado' | 'folga' | 'kanban_card'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  read: boolean
  related_id: string | null
  related_type: NotificationRelatedType | null
  created_at: string
}

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
  owner_id: string | null
  created_at: string
  updated_at: string
  steps?: Step[]
  owner?: Profile
  shares?: ProcessShare[]
}

export interface ProcessDeadline {
  id: string
  title: string
  type: string
  status: string
  priority: string
  deadline: string
}

export type FeriadoType = 'feriado' | 'ponto_facultativo'
export type FeriadoScope = 'nacional' | 'estadual' | 'municipal'
export type FeriadoRecurrence = 'anual' | 'pontual' | 'movel' | 'pascal'
export type FeriadoImpact = 'visualizacao' | 'alerta' | 'bloqueio'

export interface Feriado {
  id: string
  name: string
  type: FeriadoType
  scope: FeriadoScope
  recurrence: FeriadoRecurrence
  month: number | null
  day: number | null
  week_of_month: number | null
  weekday: number | null
  pascal_offset: number | null
  date: string | null
  impact: FeriadoImpact
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type StepMarkState = 'neutral' | 'positive' | 'negative'

export type EnsinoTipo = 'Lei' | 'Decreto' | 'Instrução Normativa' | 'Portaria' | 'Resolução' | 'Nota Técnica' | 'Manual' | 'Outro'

export const ENSINO_TIPOS: EnsinoTipo[] = [
  'Lei', 'Decreto', 'Instrução Normativa', 'Portaria', 'Resolução', 'Nota Técnica', 'Manual', 'Outro',
]

export const ENSINO_TIPO_KIND: Record<EnsinoTipo, string> = {
  'Lei': 'info',
  'Decreto': 'warning',
  'Instrução Normativa': 'success',
  'Portaria': 'info',
  'Resolução': 'warning',
  'Nota Técnica': 'success',
  'Manual': 'info',
  'Outro': '',
}

export interface Ensino {
  id: string
  title: string
  tipo: EnsinoTipo
  objetivo: string | null
  fonte: string | null
  link: string
  data_publicacao: string | null
  author_id: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Step {
  id: string
  process_id: string
  title: string
  description: string | null
  step_type: string | null
  performed_by: string | null
  reference_link: string | null
  mark_state: StepMarkState | null
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

// ── Kanban ────────────────────────────────────────────────────────────

export type KanbanColumnKey = 'todo' | 'doing' | 'review' | 'done'
export type KanbanColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'

export const KANBAN_COLUMNS: { key: KanbanColumnKey; label: string }[] = [
  { key: 'todo',   label: 'A Fazer'      },
  { key: 'doing',  label: 'Em Andamento' },
  { key: 'review', label: 'Em Revisão'   },
  { key: 'done',   label: 'Concluído'    },
]

export const KANBAN_COLOR_HEX: Record<KanbanColor, string> = {
  red:    '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green:  '#22c55e',
  blue:   '#3b82f6',
  purple: '#a855f7',
}

export interface KanbanCard {
  id:          string
  title:       string
  description: string | null
  column_key:  KanbanColumnKey
  color:       KanbanColor | null
  priority:    Priority | null
  due_date:    string | null
  owner_id:    string
  created_at:  string
  updated_at:  string
}

export interface KanbanCardWithShare extends KanbanCard {
  is_owner:  boolean
  shared_by: { id: string; full_name: string } | null
}

export interface KanbanShare {
  id:                   string
  card_id:              string
  shared_with_user_id:  string
  shared_by_user_id:    string
  created_at:           string
  profile?:             Profile
}

// ── Mantidos por compatibilidade com imports existentes
/** @deprecated use getProcessTypeLabel() */
export const PROCESS_TYPE_LABELS = LEGACY_PROCESS_TYPES
/** @deprecated use getStepTypeLabel() */
export const STEP_TYPE_LABELS = LEGACY_STEP_TYPES
