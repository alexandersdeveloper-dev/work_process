import type { Metadata } from 'next'
import './globals.css'
import { ShellProvider } from '@/components/shell/ShellProvider'
import AppShell from '@/components/shell/AppShell'

export const metadata: Metadata = {
  title: 'Work Process',
  description: 'Gestão de processos de trabalho',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <ShellProvider>
          <AppShell>{children}</AppShell>
        </ShellProvider>
      </body>
    </html>
  )
}
