export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import UsuariosClient from './UsuariosClient'
import type { Profile } from '@/types'

const PAGE_SIZE = 20

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createServerSupabaseClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('full_name', { ascending: true })
    .range(from, to)

  const users = (data as Profile[]) ?? []
  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <UsuariosClient
      users={users}
      total={total}
      page={page}
      totalPages={totalPages}
      currentUserId={currentUser?.id ?? ''}
    />
  )
}
