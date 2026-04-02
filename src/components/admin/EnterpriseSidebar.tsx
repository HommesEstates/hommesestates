'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  Image,
  Building2,
  Users,
  MessageSquare,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Bell,
  Search,
  BarChart3,
  Layers,
  Palette,
  Globe,
  FileStack,
  History,
  UserCog,
  Crown,
} from 'lucide-react'
import { hasPermission, type SessionUser } from '@/lib/auth'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  requiredRole: SessionUser['role']
  children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, requiredRole: 'VIEWER' },
  {
    name: 'Content',
    href: '/admin/content',
    icon: FileText,
    requiredRole: 'EDITOR',
    children: [
      { name: 'Pages', href: '/admin/pages' },
      { name: 'Navigation', href: '/admin/navigation' },
      { name: 'SEO Settings', href: '/admin/seo' },
    ],
  },
  {
    name: 'Media',
    href: '/admin/media',
    icon: Image,
    requiredRole: 'EDITOR',
    children: [
      { name: 'Library', href: '/admin/media' },
      { name: 'Upload', href: '/admin/media/upload' },
    ],
  },
  { name: 'Properties', href: '/admin/properties', icon: Building2, requiredRole: 'PROPERTY_MANAGER' },
  { name: 'Floor Plans', href: '/admin/floor-planner', icon: Layers, requiredRole: 'PROPERTY_MANAGER' },
  { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare, requiredRole: 'EDITOR' },
  { name: 'Partners', href: '/admin/partners', icon: Award, requiredRole: 'EDITOR' },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, requiredRole: 'ADMIN' },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    requiredRole: 'ADMIN',
    children: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Roles & Permissions', href: '/admin/users/roles' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
    ],
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    requiredRole: 'ADMIN',
    children: [
      { name: 'General', href: '/admin/settings' },
      { name: 'Theme', href: '/admin/theme' },
      { name: 'Integrations', href: '/admin/settings/integrations' },
    ],
  },
]

interface EnterpriseSidebarProps {
  user: SessionUser | null
}

export function EnterpriseSidebar({ user }: EnterpriseSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [notifications, setNotifications] = useState(3)

  // Auto-expand current section
  useEffect(() => {
    const currentSection = navigation.find(item =>
      pathname.startsWith(item.href) && item.children
    )
    if (currentSection && !expandedSections.includes(currentSection.name)) {
      setExpandedSections(prev => [...prev, currentSection.name])
    }
  }, [pathname])

  const toggleSection = (name: string) => {
    setExpandedSections(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const filteredNav = navigation.filter(item =>
    user && hasPermission(user.role, item.requiredRole)
  )

  // Debug: Check if navigation is rendering
  console.log('Sidebar Debug - User:', user?.role, 'FilteredNav count:', filteredNav.length, 'Items:', filteredNav.map(n => n.name))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo & Brand */}
      <div className="p-6" style={{ boxShadow: '0 1px 0 0 rgba(16, 24, 40, 0.06)' }}>
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/20 group-hover:shadow-accent/30 transition-all duration-500">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-text dark:text-white">Hommes</h1>
            <p className="text-xs text-text/50 dark:text-white/50 font-medium tracking-wider">ENTERPRISE CMS</p>
          </div>
        </Link>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="px-4 py-4" style={{ boxShadow: '0 1px 0 0 rgba(16, 24, 40, 0.06)' }}>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-sm" style={{ boxShadow: '0 2px 8px -2px rgba(16, 24, 40, 0.04)' }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent-dark/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-text/50 dark:text-white/50 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin pointer-events-auto">
        {filteredNav.length === 0 && (
          <div className="px-3 py-4 text-sm text-text/50 dark:text-white/50">
            No menu items available for your role
          </div>
        )}
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const isExpanded = expandedSections.includes(item.name)
          const Icon = item.icon
          const hasChildren = item.children && item.children.length > 0

          return (
            <div key={item.name} className="pointer-events-auto">
              {hasChildren ? (
                <button
                  onClick={() => {
                    console.log('Toggle section:', item.name)
                    toggleSection(item.name)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 group text-left pointer-events-auto cursor-pointer
                    ${isActive
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'text-text/70 dark:text-white/70 hover:bg-white/5 dark:hover:bg-white/5 hover:text-text dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text/50 dark:text-white/50 group-hover:text-current'}`} />
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  {item.name === 'Notifications' && notifications > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {notifications}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 group pointer-events-auto cursor-pointer
                    ${isActive
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'text-text/70 dark:text-white/70 hover:bg-white/5 dark:hover:bg-white/5 hover:text-text dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text/50 dark:text-white/50 group-hover:text-current'}`} />
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  {item.name === 'Notifications' && notifications > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {notifications}
                    </span>
                  )}
                </Link>
              )}

              {/* Submenu */}
              <AnimatePresence>
                {hasChildren && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-10 pr-2 py-1 space-y-0.5">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`
                              block px-3 py-2 rounded-xl text-sm transition-all duration-300
                              ${isChildActive
                                ? 'bg-accent/10 text-accent font-medium'
                                : 'text-text/60 dark:text-white/60 hover:text-text dark:hover:text-white hover:bg-white/5 dark:hover:bg-white/5'
                              }
                            `}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 space-y-1" style={{ boxShadow: '0 -1px 0 0 rgba(16, 24, 40, 0.06)' }}>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text/70 dark:text-white/70 hover:bg-muted dark:hover:bg-white/5 hover:text-text dark:hover:text-white transition-all text-sm"
        >
          <Globe className="w-4 h-4" />
          <span>View Website</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-border/50"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-40 w-72 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
            />
          </>
        )}
      </AnimatePresence>
    </>
  )
}
