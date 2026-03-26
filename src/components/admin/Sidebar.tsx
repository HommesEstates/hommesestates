'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Image,
  Building2,
  Search,
  Settings,
  Users,
  MessageSquare,
  Award,
  Palette,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Pages', href: '/admin/pages', icon: FileText },
  { name: 'Media Library', href: '/admin/media', icon: Image },
  { name: 'Navigation', href: '/admin/navigation', icon: Menu },
  { name: 'Properties', href: '/admin/properties', icon: Building2 },
  { name: 'SEO', href: '/admin/seo', icon: Search },
  { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare },
  { name: 'Partners', href: '/admin/partners', icon: Award },
  { name: 'Theme', href: '/admin/theme', icon: Palette },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-copper-gradient flex items-center justify-center">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold">Hommes CMS</h1>
            <p className="text-xs text-text/60 dark:text-white/60">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'bg-copper-gradient text-white shadow-lg'
                    : 'text-text/70 dark:text-white/70 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-lg"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl"
        >
          <SidebarContent />
        </motion.aside>
      )}

      {/* Mobile Overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  )
}
