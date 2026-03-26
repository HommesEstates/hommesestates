"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { login as backendLogin, me as backendMe } from "@/lib/backend"

export default function BackendLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await backendLogin(username, password)
      const info = await backendMe()
      if (info?.role === "staff") {
        router.push("/admin")
      } else if (info?.role === "portal") {
        router.push("/portal")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section-container max-w-md mx-auto py-16">
      <h1 className="text-3xl font-heading font-bold mb-6">Backend Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="px-6 py-3 bg-copper-gradient text-white rounded hover:opacity-90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  )
}
