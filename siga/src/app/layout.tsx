import type { Metadata } from 'next'
import './globals.css'
import { ShellProvider } from '@/components/shell/ShellProvider'
import AppShell from '@/components/shell/AppShell'
import { UserProvider } from '@/lib/user-context'
import QueryProvider from '@/components/QueryProvider'
import { ActionLoaderProvider } from '@/contexts/ActionLoaderContext'
import ActionLoader from '@/components/ActionLoader'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Profile } from '@/types'

export const metadata: Metadata = {
  title: 'Work Process',
  description: 'Gestão de processos de trabalho',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, cargo')
      .eq('id', user.id)
      .single()
    profile = (data as Profile) ?? null
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Anti-flash: aplica tema antes do React hidratar */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var s = localStorage.getItem('siga_theme');
            var p = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', s || p);
          })();
        ` }} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <QueryProvider>
          <ActionLoaderProvider>
            <ActionLoader />
            <UserProvider initialUser={user} initialProfile={profile}>
              <ShellProvider>
                <AppShell>{children}</AppShell>
              </ShellProvider>
            </UserProvider>
          </ActionLoaderProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
