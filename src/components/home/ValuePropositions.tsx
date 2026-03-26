'use client'

import { motion } from 'framer-motion'
import { Building2, TrendingUp, Shield, Award } from 'lucide-react'
import Link from 'next/link'

const propositions = [
  {
    audience: 'luxury',
    title: 'Luxury Ownership',
    subtitle: 'Executive Suites & Estates',
    description:
      'Own an executive suite in prime locations, delivered turnkey with premium finishes and dedicated facility management.',
    features: [
      'Prime Location Selection',
      'Turnkey Solutions',
      'Premium Finishes',
      'Dedicated Facility Management',
    ],
    icon: Building2,
    cta: { text: 'Schedule Private Tour', href: '/contact?purpose=buy' },
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053',
  },
  {
    audience: 'investor',
    title: 'Strategic Investment',
    subtitle: 'Yield-Generating Properties for Rent or Resale',
    description:
      'Invest in Grade-A properties, generate rental income, and exit within 5-7 years at a premium with our proven investment strategy.',
    features: [
      'High-Yield Opportunities',
      'Proven ROI Track Record',
      'Professional Management',
      'Exit Strategy Planning',
    ],
    icon: TrendingUp,
    cta: { text: 'Download Investment Pack', href: '/contact?purpose=invest' },
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073',
  },
]

export function ValuePropositions() {
  return (
    <section className="section-container">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-heading font-bold mb-4"
        >
          Tailored Solutions for Your{' '}
          <span className="gradient-text">Success</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-text/70 dark:text-white/70 max-w-3xl mx-auto"
        >
          Whether you're seeking a luxury property for personal ownership or a
          strategic investment for wealth creation, we have the expertise and
          portfolio to match your goals.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {propositions.map((prop, index) => (
          <motion.div
            key={prop.audience}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 shadow-xl hover:shadow-2xl transition-all duration-500"
          >
            {/* Image */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={prop.image}
                alt={prop.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-accent rounded-lg">
                    <prop.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-bold text-white">
                      {prop.title}
                    </h3>
                    <p className="text-white/80 text-sm">{prop.subtitle}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-text/80 dark:text-white/80 mb-6 leading-relaxed">
                {prop.description}
              </p>

              <ul className="space-y-3 mb-8">
                {prop.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-sm text-text/70 dark:text-white/70">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={prop.cta.href}
                className="inline-flex items-center gap-2 px-6 py-3 bg-copper-gradient text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
              >
                {prop.cta.text}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
