import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/shell/Sidebar'
import Topbar from '@/components/shell/Topbar'
import { ShellProvider } from '@/components/shell/ShellProvider'

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
          <div className="app">
            <Sidebar />
            <div className="main">
              <Topbar />
              <div className="content">
                {children}
              </div>
            </div>
          </div>
        </ShellProvider>
      </body>
    </html>
  )
}
