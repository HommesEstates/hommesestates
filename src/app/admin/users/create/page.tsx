'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

const roles = [
  { value: 'ADMIN', label: 'Administrator', description: 'Full system access' },
  { value: 'EDITOR', label: 'Editor', description: 'Can edit content and properties' },
  { value: 'DESIGNER', label: 'Designer', description: 'Can modify visual assets' },
  { value: 'PROPERTY_MANAGER', label: 'Property Manager', description: 'Can manage properties and offers' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
]

export default function CreateAdminUser() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/users')
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-12 bg-white dark:bg-[#0a0a0a] rounded-2xl max-w-md"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-text dark:text-white mb-2">User Created!</h2>
          <p className="text-text/60 dark:text-white/60 mb-6">
            The admin account has been successfully created.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-text dark:text-white">
            Create Admin User
          </h1>
          <p className="text-text/60 dark:text-white/60 mt-1">
            Add a new team member to the admin panel
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-8"
      >
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text/80 dark:text-white/80 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text/80 dark:text-white/80 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-text/80 dark:text-white/80 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-12 py-3 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                placeholder="Min 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text/40 dark:text-white/40 hover:text-text dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-text/80 dark:text-white/80 mb-3">
              Role & Permissions
            </label>
            <div className="grid gap-3">
              {roles.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    formData.role === role.value
                      ? 'bg-accent/10 border-2 border-accent'
                      : 'bg-surface border-2 border-transparent hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${
                    formData.role === role.value ? 'bg-accent text-white' : 'bg-white/5'
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      formData.role === role.value ? 'text-accent' : 'text-text dark:text-white'
                    }`}>
                      {role.label}
                    </p>
                    <p className="text-sm text-text/60 dark:text-white/60">{role.description}</p>
                  </div>
                  {formData.role === role.value && (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Link
              href="/admin/users"
              className="flex-1 px-6 py-3 bg-surface hover:bg-white/5 rounded-xl font-medium transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
