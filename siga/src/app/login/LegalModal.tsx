'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  type: 'termos' | 'privacidade' | null
  onClose: () => void
}

const CONTENT = {
  termos: {
    title: 'Termos de Uso',
    sections: [
      {
        heading: '1. Finalidade',
        body: 'O SIGA — Sistema Integrado de Gestão Administrativa é uma plataforma de uso interno da Secretaria Municipal de Parintins/AM, destinada exclusivamente à tramitação de processos administrativos, controle de prazos, comunicados institucionais e capacitação de servidores.',
      },
      {
        heading: '2. Acesso e credenciais',
        body: 'O acesso ao sistema é restrito a servidores habilitados pela administração. As credenciais (e-mail e senha) são pessoais e intransferíveis. O usuário é responsável por manter o sigilo de sua senha e por todas as ações realizadas sob sua conta.',
      },
      {
        heading: '3. Uso adequado',
        body: 'O sistema deve ser utilizado exclusivamente para fins institucionais. É vedado compartilhar credenciais, tentar acessar dados de outros usuários sem autorização, inserir informações falsas, ou utilizar o sistema para fins alheios ao serviço público.',
      },
      {
        heading: '4. Monitoramento e auditoria',
        body: 'Todas as ações realizadas no sistema são registradas em logs de auditoria, conforme exigência da Lei de Acesso à Informação (Lei nº 12.527/2011) e da Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018). O administrador do sistema pode acessar esses registros a qualquer momento.',
      },
      {
        heading: '5. Suspensão de acesso',
        body: 'O acesso pode ser suspenso ou revogado pela administração em caso de uso indevido, exoneração, transferência ou encerramento do vínculo funcional. O descumprimento dos termos pode ensejar responsabilização administrativa, civil ou penal nos termos da legislação vigente.',
      },
      {
        heading: '6. Alterações',
        body: 'Estes termos podem ser atualizados a qualquer momento. O uso continuado do sistema após alterações implica aceitação das novas condições.',
      },
    ],
  },
  privacidade: {
    title: 'Política de Privacidade',
    sections: [
      {
        heading: '1. Controlador dos dados',
        body: 'A Secretaria Municipal de Parintins/AM é a controladora dos dados pessoais tratados neste sistema, nos termos do art. 5º, VI da Lei nº 13.709/2018 (LGPD).',
      },
      {
        heading: '2. Dados coletados',
        body: 'O sistema coleta e armazena: nome completo, e-mail institucional, cargo/lotação, perfil de acesso (role), e registro de ações realizadas no sistema (processos criados, etapas registradas, comunicados emitidos, ausências lançadas).',
      },
      {
        heading: '3. Finalidade e base legal',
        body: 'Os dados são utilizados exclusivamente para gestão administrativa interna. A base legal é o cumprimento de obrigação legal ou regulatória (art. 7º, II da LGPD) e o exercício regular de direitos em processo administrativo (art. 7º, VI da LGPD).',
      },
      {
        heading: '4. Compartilhamento',
        body: 'Os dados não são compartilhados com terceiros fora do ambiente institucional. O acesso interno é restrito conforme o perfil do servidor: administradores têm acesso amplo; servidores acessam apenas seus próprios dados e os compartilhados com eles.',
      },
      {
        heading: '5. Armazenamento e segurança',
        body: 'Os dados são armazenados em infraestrutura em nuvem com criptografia em trânsito (TLS) e em repouso. O acesso ao banco de dados é protegido por políticas de segurança em nível de linha (Row Level Security — RLS).',
      },
      {
        heading: '6. Retenção',
        body: 'Os dados são mantidos pelo período necessário ao cumprimento das finalidades institucionais e das obrigações legais de guarda de documentos públicos, conforme tabela de temporalidade vigente.',
      },
      {
        heading: '7. Direitos do titular',
        body: 'O servidor pode solicitar ao administrador do sistema: confirmação da existência de tratamento, acesso aos dados, correção de dados incorretos e, quando aplicável, eliminação de dados desnecessários. Solicitações devem ser encaminhadas ao setor de TI da Secretaria.',
      },
    ],
  },
}

export default function LegalModal({ type, onClose }: Props) {
  useEffect(() => {
    if (!type) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [type, onClose])

  if (!type) return null

  const { title, sections } = CONTENT[type]

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(28,25,23,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 4,
          width: '100%',
          maxWidth: 560,
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #e7e5e0',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.14em', color: '#a8a29e', textTransform: 'uppercase', marginBottom: 4 }}>
              SIGA · Work Process
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, letterSpacing: '-0.01em', color: '#1c1917' }}>
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#78716c', padding: 6, display: 'grid', placeItems: 'center',
              borderRadius: 4, flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.map((s) => (
            <div key={s.heading}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1c1917', marginBottom: 6, fontFamily: '"Space Grotesk", sans-serif' }}>
                {s.heading}
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#44403c', lineHeight: 1.65 }}>
                {s.body}
              </p>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #e7e5e0', paddingTop: 16, fontSize: 11.5, color: '#a8a29e', fontFamily: '"JetBrains Mono", monospace' }}>
            Última atualização: maio de 2026 · Parintins/AM
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
