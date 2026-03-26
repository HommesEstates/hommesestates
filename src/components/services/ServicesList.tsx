'use client'

import { motion } from 'framer-motion'
import { Building2, TrendingUp, Settings, Key, Shield, BarChart3, Users, FileText } from 'lucide-react'

const ownerServices = [
  {
    icon: Building2,
    title: 'Premium Property Purchase',
    description: 'Curated selection of luxury office suites, estates, and executive properties in prime locations with comprehensive due diligence.',
    features: ['Property sourcing', 'Legal verification', 'Negotiation support', 'Turnkey handover'],
  },
  {
    icon: Settings,
    title: 'Estate & Facility Management',
    description: 'Professional management of your property including maintenance, security, utilities, and operational oversight.',
    features: ['24/7 security', 'Maintenance services', 'Utility management', 'Staff coordination'],
  },
  {
    icon: Shield,
    title: 'Property Advisory',
    description: 'Expert guidance on market trends, property valuations, timing, and strategic decisions for your real estate portfolio.',
    features: ['Market analysis', 'Valuation services', 'Portfolio review', 'Strategic planning'],
  },
]

const investorServices = [
  {
    icon: TrendingUp,
    title: 'Investment Property Acquisition',
    description: 'High-yield investment opportunities with proven ROI potential, comprehensive market analysis, and professional due diligence.',
    features: ['ROI projections', 'Market research', 'Risk assessment', 'Portfolio diversification'],
  },
  {
    icon: Key,
    title: 'Rental Management',
    description: 'End-to-end tenant management including screening, rent collection, maintenance, and compliance with all regulations.',
    features: ['Tenant screening', 'Rent collection', 'Property maintenance', 'Legal compliance'],
  },
  {
    icon: BarChart3,
    title: 'Resale & Exit Strategy',
    description: 'Strategic planning and execution for profitable property exits, market timing, and portfolio rebalancing.',
    features: ['Market timing', 'Buyer identification', 'Price optimization', 'Transaction management'],
  },
]

const sharedServices = [
  {
    icon: Users,
    title: 'Consultation & Planning',
    description: 'Personalized consultation to understand your goals and create a customized real estate strategy.',
    features: ['Goal assessment', 'Custom strategy', 'Financial planning', 'Risk management'],
  },
  {
    icon: FileText,
    title: 'Legal & Documentation',
    description: 'Complete legal support including contract review, title verification, and regulatory compliance.',
    features: ['Contract review', 'Title verification', 'Regulatory compliance', 'Transaction documentation'],
  },
]

export function ServicesList() {
  return (
    <section className="section-container">
      {/* Owner Services */}
      <div className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-heading font-bold mb-4">
            For <span className="gradient-text">Luxury Owners</span>
          </h2>
          <p className="text-lg text-text/80 dark:text-white/85 max-w-2xl mx-auto">
            Premium services designed for discerning property owners seeking excellence in every detail
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ownerServices.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>

      {/* Investor Services */}
      <div className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-heading font-bold mb-4">
            For <span className="gradient-text">Strategic Investors</span>
          </h2>
          <p className="text-lg text-text/80 dark:text-white/85 max-w-2xl mx-auto">
            Investment-focused services to maximize returns and minimize risks in your real estate portfolio
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {investorServices.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>

      {/* Shared Services */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-heading font-bold mb-4">
            For <span className="gradient-text">Everyone</span>
          </h2>
          <p className="text-lg text-text/80 dark:text-white/85 max-w-2xl mx-auto">
            Essential services available to all our clients regardless of their investment approach
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {sharedServices.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServiceCard({ service, index }: { service: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group p-8 bg-surface rounded-2xl shadow-lg card-hover"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-4 bg-copper-gradient rounded-xl group-hover:scale-110 transition-transform duration-300">
          <service.icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-heading font-bold">{service.title}</h3>
      </div>

      <p className="text-text/80 dark:text-white/85 mb-6 leading-relaxed">
        {service.description}
      </p>

      <ul className="space-y-3">
        {service.features.map((feature: string) => (
          <li key={feature} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
            <span className="text-sm text-text/80 dark:text-white/80">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
