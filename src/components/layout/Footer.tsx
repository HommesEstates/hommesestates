'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowRight
} from 'lucide-react'
import { odooAPI } from '@/lib/api'
import { useEnsureSection } from '@/components/editable/useEnsureSection'
import EditableText from '@/components/editable/EditableText'

const navigation = {
  main: [
    { name: 'Properties', href: '/properties' },
    { name: 'Investment', href: '/properties?investment_ready=true' },
    { name: 'Services', href: '/services' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
  ],
}

export function Footer() {
  const [loading, setLoading] = useState(false)
  const { section, content } = useEnsureSection({
    slug: 'global',
    key: 'footer',
    type: 'CONTENT',
    defaults: {
      address: 'Suite 201, Hommes Tower\n123 Business Avenue\nAbuja, Nigeria',
      phone: '+234 800 HOMMES',
      email: 'invest@hommesestates.com',
      newsletter: 'Subscribe to our newsletter for exclusive investment opportunities and market insights.',
    },
  })

  return (
    <footer className="bg-bg dark:bg-[#030712] text-text dark:text-white relative overflow-hidden backdrop-blur-xl border-t border-border dark:border-white/10 transition-colors duration-500">
      {/* Decorative gradient */}
      <div className="absolute -top-64 -right-64 w-[40rem] h-[40rem] bg-accent/5 dark:bg-orange-500/5 rounded-full blur-[100px]" />
      
      <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 xl:gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="inline-block">
              <div className="text-3xl font-heading font-bold tracking-tight">
                <span className="text-text dark:text-white">Hommes</span>
                <span className="gradient-text"> Estates</span>
              </div>
            </Link>
            
            <div className="space-y-4">
              <EditableText
                sectionId={section?.id || 'pending'}
                path="newsletter"
                value={content?.newsletter || ''}
                as="p"
                className="text-text/60 dark:text-white/60 text-sm leading-relaxed max-w-sm font-light"
              />
              <form className="flex gap-2 max-w-sm mt-6">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-black/5 dark:bg-white/5 border border-border dark:border-white/10 rounded-sm px-4 py-3 text-sm flex-grow focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors font-light text-text dark:text-white placeholder:text-text/40 dark:placeholder:text-white/30"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-accent hover:bg-accent-dark text-white px-5 py-3 rounded-sm transition-colors duration-300 flex items-center justify-center group disabled:opacity-50"
                >
                  {loading ? '...' : <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] mb-8 text-text/90 dark:text-white/90">Navigation</h3>
            <ul className="space-y-4">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-text/60 dark:text-white/60 hover:text-accent transition-colors duration-300 text-sm font-light flex items-center group"
                  >
                    <span className="w-0 group-hover:w-2 h-[1px] bg-accent mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] mb-8 text-text/90 dark:text-white/90">Contact Us</h3>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                <EditableText
                  sectionId={section?.id || 'pending'}
                  path="address"
                  value={content?.address || ''}
                  as="p"
                  className="text-text/60 dark:text-white/60 text-sm whitespace-pre-line font-light leading-relaxed"
                />
              </li>
              <li className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                <EditableText
                  sectionId={section?.id || 'pending'}
                  path="phone"
                  value={content?.phone || ''}
                  as="p"
                  className="text-text/60 dark:text-white/60 text-sm font-light"
                />
              </li>
              <li className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                <EditableText
                  sectionId={section?.id || 'pending'}
                  path="email"
                  value={content?.email || ''}
                  as="p"
                  className="text-text/60 dark:text-white/60 text-sm font-light"
                />
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] mb-8 text-text/90 dark:text-white/90">Follow Us</h3>
            <div className="flex gap-4">
              {navigation.social.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="w-10 h-10 rounded-full border border-border dark:border-white/10 flex items-center justify-center text-text/60 dark:text-white/60 hover:bg-accent hover:border-accent hover:text-white transition-all duration-300"
                  >
                    <span className="sr-only">{item.name}</span>
                    <Icon className="w-4 h-4" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-border dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-text/40 dark:text-white/40 text-xs font-light tracking-wide">
            &copy; {new Date().getFullYear()} Hommes Estates. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {navigation.legal.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-text/40 dark:text-white/40 hover:text-text dark:hover:text-white transition-colors duration-300 text-xs font-light tracking-wide"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
