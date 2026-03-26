'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Building2,
  TrendingUp,
  Settings,
  Key,
  Shield,
  BarChart3,
} from 'lucide-react'

const services = [
  {
    icon: Building2,
    title: 'Premium Purchases',
    description:
      'Curated selection of luxury office suites, estates, and executive properties in prime locations.',
    category: 'owner',
  },
  {
    icon: TrendingUp,
    title: 'Investment Acquisitions',
    description:
      'High-yield investment opportunities with proven ROI and professional management support.',
    category: 'investor',
  },
  {
    icon: Settings,
    title: 'Facility Management',
    description:
      'Comprehensive estate services including maintenance, security, and operational management.',
    category: 'owner',
  },
  {
    icon: Key,
    title: 'Rental Management',
    description:
      'End-to-end tenant management, rent collection, and property maintenance for investors.',
    category: 'investor',
  },
  {
    icon: Shield,
    title: 'Property Advisory',
    description:
      'Expert consultation on market trends, valuations, and investment strategies.',
    category: 'both',
  },
  {
    icon: BarChart3,
    title: 'Resale & Exit Strategy',
    description:
      'Strategic planning and execution for profitable property exits and portfolio rebalancing.',
    category: 'investor',
  },
]

export function ServicesOverview() {
  return (
    <section className="section-container">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-heading font-bold mb-4"
        >
          Comprehensive <span className="gradient-text">Services</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-text/70 dark:text-white/70 max-w-3xl mx-auto"
        >
          From acquisition to management and exit, we provide end-to-end
          solutions for property owners and investors.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {services.map((service, index) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group p-8 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg card-hover"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-4 bg-copper-gradient rounded-xl group-hover:scale-110 transition-transform duration-300">
                <service.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-heading font-bold mb-2">
                  {service.title}
                </h3>
                <p className="text-text/70 dark:text-white/70 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>

            {/* Category Badge */}
            <div className="mt-4">
              {service.category === 'owner' && (
                <span className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full font-semibold">
                  For Owners
                </span>
              )}
              {service.category === 'investor' && (
                <span className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full font-semibold">
                  For Investors
                </span>
              )}
              {service.category === 'both' && (
                <span className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-full font-semibold">
                  For All
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 px-8 py-4 bg-copper-gradient text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          Explore All Services
        </Link>
      </div>
    </section>
  )
}
