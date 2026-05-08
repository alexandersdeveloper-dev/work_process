'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase'
import type { Folga, AusenciaType } from '@/types'

interface Props {
  folga: Folga
  onClose: () => void
  onSaved: () => void
}

function fmtLong(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function EditFolgaModal({ folga, onClose, onSaved }: Props) {
  const supabase = createClient()

  const [type, setType] = useState<AusenciaType>(folga.type)
  const [startDate, setStartDate] = useState(folga.date)
  const [endDate, setEndDate] = useState(folga.end_date ?? folga.date)
  const [description, setDescription] = useState(folga.description ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!startDate) { setError('Data de início é obrigatória.'); return }
    if (type === 'ferias' && endDate < startDate) { setError('Data fim deve ser igual ou posterior ao início.'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase
      .from('folgas')
      .update({
        type,
        date: startDate,
        end_date: type === 'ferias' ? endDate : null,
        description: description.trim() || null,
      })
      .eq('id', folga.id)

    if (err) { setError(err.message); setLoading(false); return }
    setLoading(false)
    onSaved()
  }

  const content = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'modal-bg-in 0.18s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8,
        width: '100%', maxWidth: 440,
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        animation: 'modal-panel-in 0.22s cubic-bezier(.34,1.56,.64,1) both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid var(--line)',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Editar ausência</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
              {folga.profile?.full_name ?? '—'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tipo */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tipo</label>
            <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
              {(['folga', 'ferias'] as AusenciaType[]).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} style={{
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
          </div>

          {/* Datas */}
          <div style={{ display: 'grid', gridTemplateColumns: type === 'ferias' ? '1fr 1fr' : '1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {type === 'ferias' ? 'Início' : 'Data'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ fontSize: 13 }}
              />
            </div>
            {type === 'ferias' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fim</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            )}
          </div>

          {type === 'ferias' && startDate && endDate && endDate >= startDate && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: -6 }}>
              {fmtLong(startDate)} → {fmtLong(endDate)}
            </div>
          )}

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

          <div className="form-actions" style={{ marginTop: 4 }}>
            <button className="btn primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <button className="btn ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
