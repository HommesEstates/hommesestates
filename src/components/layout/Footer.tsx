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
} from 'lucide-react'
import { odooAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Properties', href: '/properties' },
    { name: 'Contact', href: '/contact' },
  ],
  services: [
    { name: 'Luxury Purchases', href: '/services#luxury' },
    { name: 'Investment Properties', href: '/services#investment' },
    { name: 'Facility Management', href: '/services#management' },
    { name: 'Rental Management', href: '/services#rental' },
  ],
  resources: [
    { name: 'Investment Guide', href: '/resources/investment-guide' },
    { name: 'Market Reports', href: '/resources/market-reports' },
    { name: 'FAQs', href: '/resources/faqs' },
    { name: 'Blog', href: '/blog' },
  ],
}

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'LinkedIn', icon: Linkedin, href: '#' },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    const success = await odooAPI.subscribeNewsletter(email)
    setLoading(false)

    if (success) {
      toast.success('Successfully subscribed to our newsletter!')
      setEmail('')
    } else {
      toast.error('Failed to subscribe. Please try again.')
    }
  }

  return (
    <footer className="relative pt-16 pb-8 text-text dark:text-white transition-colors duration-500 ease-in-out bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-12">
          {/* Brand & Description */}
          <div className="lg:col-span-4">
            <div className="text-2xl font-heading font-bold mb-4">
              <span className="text-text dark:text-white">Hommes</span>
              <span className="gradient-text"> Estates</span>
            </div>
            <p className="text-text/70 dark:text-white/70 mb-6 text-sm leading-relaxed">
              Invest in Excellence. Own with Confidence. Premium real estate
              purchases, strategic investment properties, and comprehensive
              facility management services.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-muted hover:bg-accent text-text dark:text-white rounded-lg transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-2">
            <h3 className="font-heading font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-text/70 dark:text-white/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div className="lg:col-span-2">
            <h3 className="font-heading font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-text/70 dark:text-white/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="lg:col-span-2">
            <h3 className="font-heading font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-text/70 dark:text-white/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="font-heading font-semibold text-lg mb-4">
              Stay Updated
            </h3>
            <p className="text-text/70 dark:text-white/70 text-sm mb-4">
              Subscribe to get the latest properties and market insights.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full px-4 py-2 bg-muted border border-neutral-200 dark:border-neutral-700 rounded-lg text-text dark:text-white placeholder:text-text/50 dark:placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-neutral-200 dark:border-white/10 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <div>
                <p className="text-text/70 dark:text-white/70 text-sm">
                  123 Victoria Island, Lagos, Nigeria
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <div>
                <p className="text-text/70 dark:text-white/70 text-sm">+234 123 456 7890</p>
                <p className="text-text/70 dark:text-white/70 text-sm">+234 098 765 4321</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <div>
                <p className="text-text/70 dark:text-white/70 text-sm">info@hommesestates.com</p>
                <p className="text-text/70 dark:text-white/70 text-sm">invest@hommesestates.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-200 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-text/60 dark:text-white/60 text-sm">
            © {new Date().getFullYear()} Hommes Estates & Facilities Management
            Limited. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link
              href="/privacy"
              className="text-text/60 dark:text-white/60 hover:text-accent text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-text/60 dark:text-white/60 hover:text-accent text-sm transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
