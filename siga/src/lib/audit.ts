import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface ProcessHistoryEntry {
  id: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
  actor: { full_name: string }[] | null
}

export async function getProcessHistory(processId: string, limit = 20): Promise<ProcessHistoryEntry[]> {
  try {
    const { data } = await serviceClient()
      .from('audit_logs')
      .select('id, action, metadata, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name)')
      .eq('target_id', processId)
      .eq('target_type', 'process')
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []) as unknown as ProcessHistoryEntry[]
  } catch {
    return []
  }
}

export type AuditAction =
  | 'user_created'
  | 'user_deleted'
  | 'role_changed'
  | 'password_changed'
  | 'login'
  | 'logout'
  | 'type_created'
  | 'type_updated'
  | 'type_deleted'
  | 'feriado_created'
  | 'feriado_updated'
  | 'feriado_deleted'

export async function logAudit({
  actorId,
  action,
  targetId,
  targetType,
  metadata,
  ipAddress,
}: {
  actorId: string
  action: AuditAction
  targetId?: string
  targetType?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await serviceClient().from('audit_logs').insert({
      actor_id: actorId,
      action,
      target_id: targetId ?? null,
      target_type: targetType ?? null,
      metadata: metadata ?? null,
      ip_address: ipAddress ?? null,
    })
  } catch {
    // Audit failures must never break the main request flow
    console.error('[audit] failed to write log for action:', action)
  }
}
