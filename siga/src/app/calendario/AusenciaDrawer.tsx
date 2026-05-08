'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import type { Profile, AusenciaType } from '@/types'

interface Props {
  selectedDays: string[]
  onRemoveDay: (day: string) => void
  onClose: () => void
  onRegistered: () => void
}

function fmtDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default function AusenciaDrawer({ selectedDays, onRemoveDay, onClose, onRegistered }: Props) {
  const { user } = useUser()
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [userId, setUserId] = useState('')
  const [type, setType] = useState<AusenciaType>('folga')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('full_name')
      const list = (data as Profile[] | null) ?? []
      setProfiles(list)
      if (list.length > 0) setUserId(list[0].id)
    }
    load()
  }, [])

  async function handleSubmit() {
    if (!userId || selectedDays.length === 0) {
      setError('Selecione o servidor e pelo menos um dia.')
      return
    }
    setLoading(true)
    setError('')

    const registeredBy = user!.id

    if (type === 'ferias') {
      const start = selectedDays[0]
      const end = selectedDays[selectedDays.length - 1]
      const { data, error: err } = await supabase
        .from('folgas')
        .insert({ user_id: userId, registered_by: registeredBy, date: start, end_date: end, type: 'ferias', description: description.trim() || null })
        .select().single()
      if (err) { setError(err.message); setLoading(false); return }
      await supabase.from('notifications').insert({
        user_id: userId, type: 'folga_registered', title: 'Férias registradas',
        body: `Férias de ${fmtDay(start)} a ${fmtDay(end)}.`,
        related_id: (data as { id: string }).id, related_type: 'folga',
      })
    } else {
      const records = selectedDays.map((d) => ({
        user_id: userId, registered_by: registeredBy, date: d,
        end_date: null, type: 'folga', description: description.trim() || null,
      }))
      const { data: inserted, error: err } = await supabase.from('folgas').insert(records).select()
      if (err) { setError(err.message); setLoading(false); return }
      const firstId = (inserted as { id: string }[])[0]?.id
      const label = selectedDays.length === 1 ? fmtDay(selectedDays[0]) : `${selectedDays.length} dias`
      await supabase.from('notifications').insert({
        user_id: userId, type: 'folga_registered', title: 'Folga registrada',
        body: `Folga registrada: ${label}.`,
        related_id: firstId, related_type: 'folga',
      })
    }

    setLoading(false)
    onRegistered()
  }

  return (
    <div style={{ width: 288, flexShrink: 0, position: 'sticky', top: 0 }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--line)',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Registrar ausência</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 17, lineHeight: 1, padding: '2px 4px' }}>✕</button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Dias selecionados */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Dias selecionados · {selectedDays.length}
            </div>
            {selectedDays.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', padding: '8px 0' }}>
                Clique nos dias do calendário
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 180, overflowY: 'auto' }}>
                {selectedDays.map((d) => (
                  <div key={d} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 10px', background: 'var(--panel-alt)', borderRadius: 4,
                  }}>
                    <span style={{ fontSize: 12 }}>{fmtDay(d)}</span>
                    <button
                      onClick={() => onRemoveDay(d)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12, lineHeight: 1, padding: '0 2px' }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tipo */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Tipo
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
              {(['folga', 'ferias'] as AusenciaType[]).map((t) => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: '8px 0', fontSize: 13, border: 'none', cursor: 'pointer',
                  background: type === t ? 'var(--accent)' : 'transparent',
                  color: type === t ? 'var(--bg)' : 'var(--ink-2)',
                  fontWeight: type === t ? 600 : 400,
                  transition: 'background 0.15s, color 0.15s',
                }}>
                  {t === 'folga' ? 'Folga' : 'Férias'}
                </button>
              ))}
            </div>
            {type === 'ferias' && selectedDays.length > 1 && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                1 registro de {fmtDay(selectedDays[0])} a {fmtDay(selectedDays[selectedDays.length - 1])}
              </div>
            )}
          </div>

          {/* Servidor */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Servidor</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)} style={{ fontSize: 13 }}>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          {/* Descrição */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Observação</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              style={{ fontSize: 13 }}
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}

          <button
            className="btn primary"
            onClick={handleSubmit}
            disabled={loading || selectedDays.length === 0}
            style={{ justifyContent: 'center' }}
          >
            {loading
              ? 'Salvando…'
              : selectedDays.length > 0
              ? `Registrar ${selectedDays.length} dia${selectedDays.length !== 1 ? 's' : ''}`
              : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
