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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out',
        (isScrolled || mobileMenuOpen)
          ? 'bg-white/80 dark:bg-[#030712]/90 backdrop-blur-2xl border-b border-gray-200 dark:border-white/10 shadow-sm'
          : 'bg-transparent dark:bg-transparent'
      )}
    >
      <nav className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="text-2xl font-heading font-bold tracking-tight">
              <span className="text-text dark:text-white transition-colors duration-300 group-hover:text-accent">Hommes</span>
              <span className="gradient-text"> Estates</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-300 relative group py-2',
                  pathname === item.href
                    ? 'text-accent'
                    : 'text-text/70 dark:text-white/70 hover:text-accent dark:hover:text-accent'
                )}
              >
                {item.name}
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-accent"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-6">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-300"
              aria-label="Toggle theme"
            >
              <span className="relative inline-block w-5 h-5 text-text/80 dark:text-white/80">
                <Sun className="w-5 h-5 hidden dark:block transition-transform duration-500 hover:rotate-90" />
                <Moon className="w-5 h-5 block dark:hidden transition-transform duration-500 hover:-rotate-90" />
              </span>
            </button>

            {/* Contact Button */}
            <Link
              href="/contact"
              className="hidden lg:flex items-center gap-2 px-7 py-3 bg-transparent border border-accent/30 text-accent hover:bg-accent/5 hover:border-accent transition-all duration-500 rounded-sm text-xs font-semibold uppercase tracking-[0.1em]"
            >
              <span>Get In Touch</span>
            </Link>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4 border-l border-border/50 pl-6 ml-2">
              <Link href="/login" className="text-xs font-semibold uppercase tracking-[0.1em] text-text/70 dark:text-white/70 hover:text-accent transition-colors duration-300">Sign in</Link>
              <Link href="/signup" className="text-xs font-semibold uppercase tracking-[0.1em] px-5 py-2.5 bg-text dark:bg-white text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white transition-all duration-500 rounded-sm">Sign up</Link>
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
            className="lg:hidden bg-white/95 dark:bg-[#030712]/95 backdrop-blur-2xl border-t border-gray-200 dark:border-white/10"
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
