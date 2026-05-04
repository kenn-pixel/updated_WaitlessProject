import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthCtx = createContext(null)

const adaptUser = (user) => {
  const email = user?.email ?? ''
  const role = user?.user_metadata?.role || (email.includes('admin') ? 'admin' : 'staff')
  return { id: user.id, email, role }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data?.session?.user ? adaptUser(data.session.user) : null)
      setAuthLoading(false)
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? adaptUser(session.user) : null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }
    const user = data?.user ? adaptUser(data.user) : null
    setUser(user)
    return { user }
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    const user = data?.user ? adaptUser(data.user) : null
    if (user) setUser(user)
    return { user, data }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, authLoading, login, logout, signUp }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
