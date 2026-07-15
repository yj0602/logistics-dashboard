import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { CurrentUser } from '../types/auth'

export interface AuthContextValue {
  user: CurrentUser | null
  login: (user: CurrentUser) => void
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => {
    // 새로고침 시 유지를 위해 sessionStorage 활용
    const stored = sessionStorage.getItem('currentUser')
    if (stored) {
      try {
        return JSON.parse(stored) as CurrentUser
      } catch {
        return null
      }
    }
    return null
  })

  const login = useCallback((userData: CurrentUser) => {
    setUser(userData)
    sessionStorage.setItem('currentUser', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('currentUser')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
