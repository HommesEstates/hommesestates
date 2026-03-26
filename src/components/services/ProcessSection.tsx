'use client'

import { motion } from 'framer-motion'
import { Search, FileCheck, Key, TrendingUp } from 'lucide-react'

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Discovery & Consultation',
    description: 'We begin by understanding your unique needs, goals, and preferences through detailed consultation.',
  },
  {
    icon: FileCheck,
    number: '02',
    title: 'Property Selection & Due Diligence',
    description: 'Curated property options with comprehensive market analysis, legal verification, and risk assessment.',
  },
  {
    icon: Key,
    number: '03',
    title: 'Transaction & Handover',
    description: 'Seamless transaction management from negotiation to closing, with complete documentation support.',
  },
  {
    icon: TrendingUp,
    number: '04',
    title: 'Ongoing Management & Support',
    description: 'Continued support through facility management, rental optimization, or strategic exit planning.',
  },
]

export function ProcessSection() {
  return (
    <section className="section-container bg-surface">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-heading font-bold mb-4"
        >
          Our <span className="gradient-text">Process</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-text/70 dark:text-white/70 max-w-2xl mx-auto"
        >
          A proven, systematic approach to real estate excellence
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-accent to-transparent" />
            )}

            <div className="relative p-8 bg-surface rounded-2xl shadow-lg">
              {/* Number Badge */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                <span className="text-2xl font-heading font-bold text-white">{step.number}</span>
              </div>

              <div className="mb-6">
                <div className="inline-flex p-4 bg-accent/10 rounded-xl">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>
              </div>

              <h3 className="text-xl font-heading font-bold mb-3">{step.title}</h3>
              <p className="text-text/70 dark:text-white/70 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
