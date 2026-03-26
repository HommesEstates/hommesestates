"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { login: authLogin, isAuthenticated, isLoading: authLoading } = useAuth()
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [remember, setRemember] = useState<boolean>(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/portal/offers")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('he_login_email') || ''
      const savedRemember = localStorage.getItem('he_login_remember')
      if (savedEmail) setUsername(savedEmail)
      if (savedRemember) setRemember(savedRemember === '1')
    } catch {}
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const result = await authLogin(username, password)
    
    setLoading(false)
    
    if (result.success) {
      try {
        if (remember) localStorage.setItem('he_login_email', username)
        else localStorage.removeItem('he_login_email')
        localStorage.setItem('he_login_remember', remember ? '1' : '0')
      } catch {}
      
      router.push("/portal/offers")
      return
    }
    
    setError(result.error || "Invalid credentials or server error")
  }

  if (authLoading) {
    return (
      <section className="section-container max-w-md mx-auto py-20">
        <div className="animate-pulse text-center">Loading...</div>
      </section>
    )
  }

  return (
    <section className="section-container max-w-md mx-auto py-20">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border p-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Welcome back</h1>
        <p className="text-text/60 dark:text-white/60 mb-6">Sign in to access your offers and invoices.</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg bg-muted dark:bg-neutral-800 border"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg bg-muted dark:bg-neutral-800 border"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-text/70 dark:text-white/70">
              <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} /> Remember me
            </label>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full px-6 py-3 btn-primary disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="text-sm text-text/60 mt-3">No account? <a href="/signup" className="text-accent underline">Create one</a></p>
        </form>
      </div>
    </section>
  )
}
