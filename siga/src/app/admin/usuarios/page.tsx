export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ROLE_LABELS } from '@/lib/auth-guard'
import DeleteUserButton from './DeleteUserButton'
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
    <>
      <div className="page-head">
        <div>
          <h1>Usuários</h1>
          <p className="sub">{total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/usuarios/new">
          <button className="btn primary">+ Novo usuário</button>
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Papel</th>
                <th style={{ width: 140 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="bold">{u.full_name || <span style={{ color: 'var(--muted)' }}>Sem nome</span>}</td>
                  <td>{u.cargo || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                  <td>
                    <span className={`pill ${u.role === 'admin' ? 'danger' : u.role === 'chefe' ? 'warning' : 'info'}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <Link href={`/admin/usuarios/${u.id}`}>
                        <button className="btn ghost sm">Editar</button>
                      </Link>
                      <DeleteUserButton userId={u.id} isSelf={u.id === currentUser?.id} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Página {page} de {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {page > 1 && (
                <Link href={`/admin/usuarios?page=${page - 1}`}>
                  <button className="btn ghost sm">← Anterior</button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/usuarios?page=${page + 1}`}>
                  <button className="btn ghost sm">Próxima →</button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
