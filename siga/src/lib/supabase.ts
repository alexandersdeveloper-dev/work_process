import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

function envVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars não configuradas.')
  return { url, key }
}

let _client: ReturnType<typeof createBrowserClient> | null = null

/** Client Components — singleton por sessão de browser */
export function createClient() {
  if (_client) return _client
  const { url, key } = envVars()
  _client = createBrowserClient(url, key)
  return _client
}

/** Compatibilidade: export nomeado para imports legados */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (createClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
