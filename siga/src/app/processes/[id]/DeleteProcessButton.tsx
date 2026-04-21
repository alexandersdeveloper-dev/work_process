'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DeleteProcessButton({ id }: { id: string }) {
  const router = useRouter()
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.')) return
    const { error: err } = await supabase.from('processes').delete().eq('id', id)
    if (err) { setError(err.message); return }
    router.push('/processes')
    router.refresh()
  }

  return (
    <>
      {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
      <button className="btn danger-btn" onClick={handleDelete}>
        Excluir
      </button>
    </>
  )
}
