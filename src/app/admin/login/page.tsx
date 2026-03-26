'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Login successful!')
        router.push('/admin')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-warmgray dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-block"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-copper-gradient flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-heading font-bold mb-2">
            <span className="text-text dark:text-white">Hommes Estates</span>
            <span className="gradient-text"> CMS</span>
          </h1>
          <p className="text-text/60 dark:text-white/60">
            Content Management System
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  placeholder="admin@hommesestates.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text/40 dark:text-white/40 hover:text-accent transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-copper-gradient text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text/60 dark:text-white/60">
              Protected by enterprise-grade security
            </p>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-text/50 dark:text-white/50"
        >
          © {new Date().getFullYear()} Hommes Estates & Facilities Management Limited
        </motion.p>
      </motion.div>
    </div>
  )
}
