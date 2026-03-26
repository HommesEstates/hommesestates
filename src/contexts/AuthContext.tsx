'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { fastAPI, User, AuthResponse } from '@/lib/fastapi'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (payload: {
    name: string
    email: string
    password: string
    phone?: string
  }) => Promise<{ success: boolean; error?: string; partner_id?: number }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true)
      try {
        // Check if we have a token
        if (fastAPI.isAuthenticated()) {
          // Verify with backend
          const currentUser = await fastAPI.getCurrentUser()
          if (currentUser) {
            setUser(currentUser)
          } else {
            // Token invalid, clear
            fastAPI.clearAuth()
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await fastAPI.login(username, password)
      if (result) {
        const user = fastAPI.getUser()
        setUser(user)
        return { success: true }
      }
      return { success: false, error: 'Invalid credentials' }
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Login failed'
      return { success: false, error: message }
    }
  }, [])

  const signup = useCallback(async (payload: {
    name: string
    email: string
    password: string
    phone?: string
  }) => {
    try {
      const result = await fastAPI.signup(payload)
      if (result && result.ok) {
        return { success: true, partner_id: result.partner_id }
      }
      return { success: false, error: 'Signup failed' }
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Signup failed'
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    await fastAPI.logout()
    setUser(null)
    router.push('/login')
  }, [router])

  const refreshUser = useCallback(async () => {
    const currentUser = await fastAPI.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login')
      }
    }, [isLoading, isAuthenticated, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}

// Hook for role-based access
export function useRequireRole(allowedRoles: string[]) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      router.push('/unauthorized')
    }
  }, [user, isLoading, allowedRoles, router])

  return {
    hasAccess: user && allowedRoles.includes(user.role),
    isLoading,
  }
}
