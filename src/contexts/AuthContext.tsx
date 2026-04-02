'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { unifiedClient, User, AuthResponse } from '@/lib/unified-api'

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
        const token = localStorage.getItem('he_access_token')
        if (token) {
          // Verify with backend by fetching user data
          const currentUser = await unifiedClient.getMyOffers().then(() => ({
            id: parseInt(localStorage.getItem('he_user_id') || '0'),
            name: localStorage.getItem('he_user_name') || '',
            email: localStorage.getItem('he_user_email') || '',
            role: (localStorage.getItem('he_user_role') as any) || 'customer',
            partner_id: parseInt(localStorage.getItem('he_partner_id') || '0')
          })).catch(() => null)
          
          if (currentUser && currentUser.id) {
            setUser(currentUser)
          } else {
            // Token invalid, clear
            unifiedClient.logout()
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
      const result = await unifiedClient.login(username, password)
      if (result && result.user) {
        // Store user info in localStorage for persistence
        localStorage.setItem('he_user_id', result.user.id.toString())
        localStorage.setItem('he_user_name', result.user.name)
        localStorage.setItem('he_user_email', result.user.email)
        localStorage.setItem('he_user_role', result.user.role)
        localStorage.setItem('he_partner_id', result.user.partner_id.toString())
        
        setUser(result.user)
        return { success: true }
      }
      return { success: false, error: 'Invalid credentials' }
    } catch (error: any) {
      const message = error?.message || 'Login failed'
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
      const result = await unifiedClient.signup(payload.name, payload.email, payload.phone || '', payload.password)
      if (result && result.id) {
        return { success: true, partner_id: result.id }
      }
      return { success: false, error: 'Signup failed' }
    } catch (error: any) {
      const message = error?.message || 'Signup failed'
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(async () => {
    unifiedClient.logout()
    setUser(null)
    router.push('/login')
  }, [router])

  const refreshUser = useCallback(async () => {
    // In unified client mode, user data is stored in localStorage
    const userData = {
      id: parseInt(localStorage.getItem('he_user_id') || '0'),
      name: localStorage.getItem('he_user_name') || '',
      email: localStorage.getItem('he_user_email') || '',
      role: (localStorage.getItem('he_user_role') as any) || 'customer',
      partner_id: parseInt(localStorage.getItem('he_partner_id') || '0')
    }
    if (userData.id) {
      setUser(userData as User)
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
