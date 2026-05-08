'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteUserButton({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  if (isSelf) return null

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      const json = await res.json() as { error?: string }
      alert(json.error ?? 'Erro ao excluir usuário.')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', gap: 6 }}>
        <button
          className="btn danger sm"
          disabled={loading}
          onClick={handleDelete}
        >
          {loading ? '…' : 'Confirmar'}
        </button>
        <button className="btn ghost sm" onClick={() => setConfirming(false)}>
          Cancelar
        </button>
      </span>
    )
  }

  return (
    <button className="btn ghost sm" onClick={() => setConfirming(true)}>
      Excluir
    </button>
  )
}
