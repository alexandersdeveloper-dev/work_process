'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/user-context'
import { useProfiles } from '@/hooks/use-profiles'
import { useActionLoader } from '@/contexts/ActionLoaderContext'
import type { AusenciaType } from '@/types'

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
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles()
  const { showLoader, hideLoader } = useActionLoader()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [type, setType] = useState<AusenciaType>('folga')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleServidor(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function selectAll() { setSelectedIds(profiles.map((p) => p.id)) }
  function clearAll() { setSelectedIds([]) }

  async function handleSubmit() {
    if (selectedIds.length === 0 || selectedDays.length === 0) {
      setError('Selecione ao menos um servidor e um dia.')
      return
    }
    setLoading(true)
    setError('')
    showLoader()

    const registeredBy = user!.id

    try {
      if (type === 'ferias') {
        const start = selectedDays[0]
        const end = selectedDays[selectedDays.length - 1]
        const body = `Férias de ${fmtDay(start)} a ${fmtDay(end)}.`

        const results = await Promise.all(
          selectedIds.map((uid) =>
            supabase.from('folgas')
              .insert({ user_id: uid, registered_by: registeredBy, date: start, end_date: end, type: 'ferias', description: description.trim() || null })
              .select().single()
          )
        )
        const failed = results.find((r) => r.error)
        if (failed) throw new Error(failed.error!.message)

        await Promise.all(
          results.map((r) =>
            supabase.from('notifications').insert({
              user_id: (r.data as { user_id: string }).user_id,
              type: 'folga_registered', title: 'Férias registradas', body,
              related_id: (r.data as { id: string }).id, related_type: 'folga',
            })
          )
        )
      } else {
        const label = selectedDays.length === 1 ? fmtDay(selectedDays[0]) : `${selectedDays.length} dias`

        const results = await Promise.all(
          selectedIds.map((uid) => {
            const records = selectedDays.map((d) => ({
              user_id: uid, registered_by: registeredBy, date: d,
              end_date: null, type: 'folga' as AusenciaType, description: description.trim() || null,
            }))
            return supabase.from('folgas').insert(records).select()
          })
        )
        const failed = results.find((r) => r.error)
        if (failed) throw new Error(failed.error!.message)

        await Promise.all(
          results.map((r, i) =>
            supabase.from('notifications').insert({
              user_id: selectedIds[i],
              type: 'folga_registered', title: 'Folga registrada',
              body: `Folga registrada: ${label}.`,
              related_id: (r.data as { id: string }[])[0]?.id, related_type: 'folga',
            })
          )
        )
      }

      onRegistered()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar. Tente novamente.')
    } finally {
      setLoading(false)
      hideLoader()
    }
  }

  const allSelected = profiles.length > 0 && selectedIds.length === profiles.length
  const noneSelected = selectedIds.length === 0

  const btnLabel = (() => {
    if (loading) return 'Salvando…'
    if (selectedDays.length === 0 || noneSelected) return 'Registrar'
    const dias = `${selectedDays.length} dia${selectedDays.length !== 1 ? 's' : ''}`
    const serv = `${selectedIds.length} servidor${selectedIds.length !== 1 ? 'es' : ''}`
    return `Registrar ${dias} · ${serv}`
  })()

  return (
    <div className="cal-drawer">
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 140, overflowY: 'auto' }}>
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
                {fmtDay(selectedDays[0])} → {fmtDay(selectedDays[selectedDays.length - 1])}
              </div>
            )}
          </div>

          {/* Servidores */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Servidores
                {selectedIds.length > 0 && (
                  <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 700 }}>· {selectedIds.length}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!allSelected && (
                  <button onClick={selectAll} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Todos
                  </button>
                )}
                {!noneSelected && (
                  <button onClick={clearAll} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {loadingProfiles ? (
              <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Carregando…</div>
            ) : profiles.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>Nenhum servidor disponível.</div>
            ) : (
              <div style={{ border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 180, overflowY: 'auto' }}>
                {profiles.map((p, i) => {
                  const checked = selectedIds.includes(p.id)
                  return (
                    <label key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', cursor: 'pointer',
                      background: checked ? 'var(--accent-soft)' : i % 2 === 0 ? 'transparent' : 'var(--panel-alt)',
                      transition: 'background 0.12s',
                      borderBottom: i < profiles.length - 1 ? '1px solid var(--line)' : 'none',
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleServidor(p.id)}
                        style={{ width: 'auto', margin: 0, cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.full_name}
                        </div>
                        {p.cargo && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.cargo}
                          </div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
              </div>
            )}
          </div>

          {/* Observação */}
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
            disabled={loading || selectedDays.length === 0 || noneSelected}
            style={{ justifyContent: 'center' }}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
