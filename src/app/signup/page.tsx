"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { fastAPI } from "@/lib/fastapi"

export default function SignupPage() {
  const router = useRouter()
  const { signup: authSignup, login: authLogin, isAuthenticated, isLoading: authLoading } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/portal/offers")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    try {
      setName(localStorage.getItem('he_signup_name') || '')
      setEmail(localStorage.getItem('he_signup_email') || '')
      setPhone(localStorage.getItem('he_signup_phone') || '')
    } catch {}
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    const result = await authSignup({ name, email, phone, password })
    
    if (!result.success) {
      setError(result.error || "Signup failed. Email may already be in use.")
      setLoading(false)
      return
    }
    
    // Auto-login after signup
    const loginResult = await authLogin(email, password)
    setLoading(false)
    
    if (loginResult.success) {
      router.push("/portal/offers")
      return
    }
    
    router.push("/login")
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
        <h1 className="text-3xl font-heading font-bold mb-2">Create your account</h1>
        <p className="text-text/60 dark:text-white/60 mb-6">Sign up to manage your offers, invoices and documents.</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted dark:bg-neutral-800 border"
              value={name}
              onChange={(e)=>{ setName(e.target.value); try{localStorage.setItem('he_signup_name', e.target.value)}catch{}}}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-lg bg-muted dark:bg-neutral-800 border"
              value={email}
              onChange={(e)=>{ setEmail(e.target.value); try{localStorage.setItem('he_signup_email', e.target.value)}catch{}}}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Phone (optional)</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-muted dark:bg-neutral-800 border"
              value={phone}
              onChange={(e)=>{ setPhone(e.target.value); try{localStorage.setItem('he_signup_phone', e.target.value)}catch{}}}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg bg-muted dark:bg-neutral-800 border"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full px-6 py-3 btn-primary">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
          <p className="text-sm text-text/60 mt-3">Already have an account? <a href="/login" className="text-accent underline">Sign in</a></p>
        </form>
      </div>
    </section>
  )
}
