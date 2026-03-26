'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Moon, Sun, Phone } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Properties', href: '/properties' },
  { name: 'Services', href: '/services' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      suppressHydrationWarning
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ease-in-out',
        (isScrolled || mobileMenuOpen)
          ? 'bg-white/90 dark:bg-neutral-900/85 backdrop-blur-[12px] border-b border-neutral-200/60 dark:border-neutral-800/60 shadow-md'
          : 'bg-transparent dark:bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-heading font-bold">
              <span className="text-text dark:text-white">Hommes</span>
              <span className="gradient-text"> Estates</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-semibold transition-colors relative group',
                  pathname === item.href
                    ? 'text-accent'
                    : 'text-text/80 dark:text-white/80 hover:text-accent dark:hover:text-accent'
                )}
              >
                {item.name}
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle theme"
            >
              <span className="relative inline-block w-5 h-5">
                <Sun className="w-5 h-5 hidden dark:block" />
                <Moon className="w-5 h-5 block dark:hidden" />
              </span>
            </button>

            {/* Contact Button */}
            <Link
              href="/contact"
              className="hidden lg:flex items-center gap-2 px-6 py-3 bg-copper-gradient text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Phone className="w-4 h-4" />
              <span className="font-semibold">Get In Touch</span>
            </Link>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 border rounded-lg font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800">Sign in</Link>
              <Link href="/signup" className="px-4 py-2 bg-accent text-white rounded-lg font-semibold hover:opacity-90">Sign up</Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white/90 dark:bg-transparent dark:[background-image:linear-gradient(180deg,#0B0D0F_0%,#1E1E1E_100%)] backdrop-blur-[12px] border-t border-neutral-200/60 dark:border-neutral-800/60"
          >
            <div className="px-4 py-6 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg font-semibold transition-colors',
                    pathname === item.href
                      ? 'bg-accent/10 text-accent'
                      : 'text-text dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-3 bg-copper-gradient text-white text-center rounded-lg font-semibold"
              >
                Get In Touch
              </Link>
              <div className="grid gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-6 py-3 border rounded-lg text-center font-semibold">Sign in</Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-6 py-3 bg-accent text-white text-center rounded-lg font-semibold">Sign up</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
