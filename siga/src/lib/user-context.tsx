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

const Ctx = createContext<UserCtx>({ user: null, profile: null, loading: false, refreshProfile: async () => {} })

export function useUser() { return useContext(Ctx) }

export function UserProvider({
  children,
  initialUser = null,
  initialProfile = null,
}: {
  children: React.ReactNode
  initialUser?: User | null
  initialProfile?: Profile | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [loading, setLoading] = useState(false)

  async function loadProfile(uid: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, cargo')
      .eq('id', uid)
      .single()
    setProfile((data as Profile) ?? null)
  }

  async function refreshProfile() {
    if (user) await loadProfile(user.id)
  }

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        const u = session?.user ?? null
        setUser(u)
        if (u && event !== 'TOKEN_REFRESHED' && event !== 'INITIAL_SESSION') {
          loadProfile(u.id)
        } else if (!u) {
          setProfile(null)
          setLoading(false)
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
