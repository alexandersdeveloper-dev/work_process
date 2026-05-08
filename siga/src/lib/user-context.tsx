'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/types'

interface UserCtx {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const Ctx = createContext<UserCtx>({ user: null, profile: null, loading: true, refreshProfile: async () => {} })

export function useUser() { return useContext(Ctx) }

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(uid: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    setProfile((data as Profile) ?? null)
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) await loadProfile(u.id)
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          loadProfile(u.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Ctx.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </Ctx.Provider>
  )
}
