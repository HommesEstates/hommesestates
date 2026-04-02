'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  HelpCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SessionUser } from '@/lib/auth'
import { useTheme } from 'next-themes'

interface EnterpriseHeaderProps {
  user: SessionUser
}

export function EnterpriseHeader({ user }: EnterpriseHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate breadcrumb from pathname
  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .slice(1) // Remove 'admin'
    .map((segment, index, arr) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/admin/' + arr.slice(0, index + 1).join('/'),
      isLast: index === arr.length - 1,
    }))

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl rounded-2xl" style={{ boxShadow: '0 1px 0 0 rgba(16, 24, 40, 0.06)' }}>
      <div className="flex items-center justify-between h-16 px-6 lg:px-8">
        {/* Left: Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          <Link 
            href="/admin" 
            className="text-text/50 dark:text-white/50 hover:text-text dark:hover:text-white transition-colors"
          >
            Admin
          </Link>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center gap-2">
              <span className="text-text/30 dark:text-white/30">/</span>
              {crumb.isLast ? (
                <span className="font-medium text-text dark:text-white">{crumb.label}</span>
              ) : (
                <Link 
                  href={crumb.href}
                  className="text-text/50 dark:text-white/50 hover:text-text dark:hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile: Page Title */}
        <div className="md:hidden">
          <h1 className="font-semibold text-text dark:text-white">
            {breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted dark:bg-white/5 border border-border/50 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
            <Search className="w-4 h-4 text-text/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-40 lg:w-56 text-text dark:text-white placeholder:text-text/40 dark:placeholder:text-white/40"
            />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-muted dark:hover:bg-white/5 text-text/60 dark:text-white/60 transition-colors"
          >
            {mounted ? (
              theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />
            ) : (
              <div className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-muted dark:hover:bg-white/5 text-text/60 dark:text-white/60 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4" style={{ boxShadow: '0 1px 0 0 rgba(16, 24, 40, 0.06)' }}>
                    <h3 className="font-semibold text-text dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 hover:bg-muted/50 dark:hover:bg-white/5 cursor-pointer">
                      <p className="text-sm font-medium text-text dark:text-white">New offer received</p>
                      <p className="text-xs text-text/50 dark:text-white/50 mt-1">Suite 101 - Fusion Wuse</p>
                    </div>
                    <div className="p-4 hover:bg-muted/50 dark:hover:bg-white/5 cursor-pointer">
                      <p className="text-sm font-medium text-text dark:text-white">Payment confirmed</p>
                      <p className="text-xs text-text/50 dark:text-white/50 mt-1">₦4,500,000 - Invoice #1234</p>
                    </div>
                    <div className="p-4 hover:bg-muted/50 dark:hover:bg-white/5 cursor-pointer">
                      <p className="text-sm font-medium text-text dark:text-white">New testimonial submitted</p>
                      <p className="text-xs text-text/50 dark:text-white/50 mt-1">Pending approval</p>
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <Link href="/admin/notifications" className="text-sm text-accent hover:text-accent-dark transition-colors">
                      View all notifications
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-accent-dark/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-accent">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-text/50 dark:text-white/50 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="p-4" style={{ boxShadow: '0 1px 0 0 rgba(16, 24, 40, 0.06)' }}>
                    <p className="font-medium text-text dark:text-white">{user.name}</p>
                    <p className="text-sm text-text/50 dark:text-white/50">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/admin/users/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted dark:hover:bg-white/5 text-text dark:text-white text-sm transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted dark:hover:bg-white/5 text-text dark:text-white text-sm transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted dark:hover:bg-white/5 text-text dark:text-white text-sm transition-colors"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Help & Support
                    </button>
                  </div>
                  <div className="p-2" style={{ boxShadow: '0 -1px 0 0 rgba(16, 24, 40, 0.06)' }}>
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/auth/logout', { method: 'POST' })
                        window.location.href = '/admin/login'
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 text-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
