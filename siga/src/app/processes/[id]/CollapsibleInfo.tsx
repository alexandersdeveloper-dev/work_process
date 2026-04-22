'use client'

import { useState } from 'react'

interface Field { label: string; value: React.ReactNode; mono?: boolean }

interface Props {
  description?: string | null
  fields: Field[]
}

export default function CollapsibleInfo({ description, fields }: Props) {
  const [open, setOpen] = useState(true)

  return (
    <div className="card">
      <button
        type="button"
        className="card-h"
        onClick={() => setOpen((v) => !v)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <h3>Informações</h3>
        <svg
          width="14" height="14" viewBox="0 0 16 16"
          fill="none" stroke="currentColor" strokeWidth="1.8"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.22s ease',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div className="card-b">
            {description && (
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 20, lineHeight: 1.6 }}>
                {description}
              </p>
            )}
            {fields.map((f, i) => (
              <div key={i} className="field">
                <span className="k">{f.label}</span>
                <span className={`v${f.mono ? ' mono' : ''}`}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
