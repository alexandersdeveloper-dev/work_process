'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface Props { userId: string }

export default function DeadlineNotifier({ userId }: Props) {
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const now = new Date()
      const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const todayStr = now.toISOString().split('T')[0]
      const in3Str = in3days.toISOString().split('T')[0]

      // processos do usuário com deadline nos próximos 3 dias
      const { data: processes } = await supabase
        .from('processes')
        .select('id, title, deadline')
        .eq('owner_id', userId)
        .not('deadline', 'is', null)
        .gte('deadline', todayStr)
        .lte('deadline', in3Str)
        .not('status', 'in', '("completed","cancelled")')

      if (!processes || processes.length === 0) return

      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const processIds = (processes as { id: string; title: string; deadline: string }[]).map(p => p.id)

      // 1 query para buscar todas as notificações recentes de uma vez
      const { data: existing } = await supabase
        .from('notifications')
        .select('related_id')
        .eq('user_id', userId)
        .eq('type', 'deadline_soon')
        .in('related_id', processIds)
        .gte('created_at', yesterday)

      const notifiedIds = new Set((existing ?? []).map((n: { related_id: string }) => n.related_id))

      // Inserts paralelos apenas para os processos ainda não notificados
      await Promise.all(
        (processes as { id: string; title: string; deadline: string }[])
          .filter(p => !notifiedIds.has(p.id))
          .map(p => {
            const days = Math.ceil((new Date(p.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return supabase.from('notifications').insert({
              user_id: userId,
              type: 'deadline_soon',
              title: 'Prazo se aproximando',
              body: `"${p.title}" vence em ${days <= 0 ? 'hoje' : `${days} dia${days !== 1 ? 's' : ''}`}.`,
              related_id: p.id,
              related_type: 'process',
            })
          })
      )
    }

    check()
  }, [userId])

  return null
}
