import type { UserRole } from '@/types'

export function canEdit(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'chefe'
}

export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'admin'
}

export function canPublish(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'chefe'
}

export function canManageFolgas(role: UserRole | null | undefined): boolean {
  return role === 'admin' || role === 'chefe'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  chefe: 'Chefe',
  assistente: 'Assistente',
  servidor: 'Servidor',
}
