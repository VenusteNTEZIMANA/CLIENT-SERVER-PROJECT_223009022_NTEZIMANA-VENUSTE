
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { verifyWithDjango } from '../lib/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const requestId = useRef(0)

  useEffect(() => {
    let mounted = true

    const verifySession = async (newSession: Session | null) => {
      const currentRequest = ++requestId.current

      if (!mounted) return

      if (!newSession) {
        setUser(null)
        setSession(null)
        setLoading(false)
        return
      }

      setSession(newSession)
      setUser(null)
      setLoading(true)

      try {
        const result = await verifyWithDjango(
          newSession.access_token
        )

        if (
          !mounted ||
          currentRequest !== requestId.current
        ) return

        if (result.success) {
          setUser(newSession.user)
        } else {
          setUser(null)
          console.error(
            'Django verification failed:',
            result.message
          )
        }
      } catch (error) {
        if (
          mounted &&
          currentRequest === requestId.current
        ) {
          setUser(null)
          console.error('Authentication error:', error)
        }
      } finally {
        if (
          mounted &&
          currentRequest === requestId.current
        ) {
          setLoading(false)
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        void verifySession(newSession)
      }
    )

    // Check existing session when application starts
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return

      if (error) {
        console.error('Session loading error:', error)
        setLoading(false)
        return
      }

      void verifySession(data.session)
    })

    return () => {
      mounted = false
      requestId.current++
      subscription.unsubscribe()
    }
  }, [])

  // LOGOUT
  const logout = async () => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// CUSTOM AUTH HOOK
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}