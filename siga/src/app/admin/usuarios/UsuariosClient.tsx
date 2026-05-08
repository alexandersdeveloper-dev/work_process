'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ROLE_LABELS } from '@/lib/auth-guard'
import DeleteUserButton from './DeleteUserButton'
import NewUserForm from './NewUserForm'
import EditUserForm from './[id]/EditUserForm'
import type { Profile } from '@/types'

interface Props {
  users: Profile[]
  total: number
  page: number
  totalPages: number
  currentUserId: string
}

export default function UsuariosClient({ users, total, page, totalPages, currentUserId }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  function closeModal() { setShowModal(false) }
  function closeEdit() { setEditingUser(null) }

  const modal = showModal ? createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'modal-bg-in 0.18s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8,
        width: '100%', maxWidth: 480,
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid var(--line)',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Novo usuário</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>Criar conta de acesso ao SIGA</div>
          </div>
          <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: 18 }}>
          <NewUserForm
            onSuccess={() => { closeModal(); router.refresh() }}
            onCancel={closeModal}
          />
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Usuários</h1>
          <p className="sub">{total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn primary" onClick={() => setShowModal(true)}>+ Novo usuário</button>
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
                      <button className="btn ghost sm" onClick={() => setEditingUser(u)}>Editar</button>
                      <DeleteUserButton userId={u.id} isSelf={u.id === currentUserId} />
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

      {modal}

      {editingUser && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'modal-bg-in 0.18s ease both',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit() }}
        >
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8,
            width: '100%', maxWidth: 480,
            boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
            animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: '1px solid var(--line)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Editar usuário</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
                  {editingUser.full_name || 'Sem nome'}
                </div>
              </div>
              <button onClick={closeEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div style={{ padding: 18 }}>
              <EditUserForm
                profile={editingUser}
                onSuccess={() => { closeEdit(); router.refresh() }}
                onCancel={closeEdit}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
