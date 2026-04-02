'use client'

import { motion } from 'framer-motion'
import { 
  Building2, 
  TrendingUp, 
  Settings, 
  Key, 
  Shield, 
  BarChart3, 
  Users, 
  FileText,
  ArrowRight,
  Home,
  Wallet,
  Briefcase,
  ClipboardList,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

const ownerServices = [
  {
    icon: Building2,
    title: 'Premium Property Purchase',
    description: 'Curated selection of luxury office suites, estates, and executive properties in prime locations with comprehensive due diligence.',
    features: ['Property sourcing', 'Legal verification', 'Negotiation support', 'Turnkey handover'],
    link: '/properties',
    highlight: 'Exclusive Access',
  },
  {
    icon: Settings,
    title: 'Estate & Facility Management',
    description: 'Professional management of your property including maintenance, security, utilities, and operational oversight.',
    features: ['24/7 security', 'Maintenance services', 'Utility management', 'Staff coordination'],
    link: '/contact',
    highlight: 'Full Service',
  },
  {
    icon: Shield,
    title: 'Property Advisory',
    description: 'Expert guidance on market trends, property valuations, timing, and strategic decisions for your real estate portfolio.',
    features: ['Market analysis', 'Valuation services', 'Portfolio review', 'Strategic planning'],
    link: '/contact',
    highlight: 'Expert Guidance',
  },
  {
    icon: Home,
    title: 'Interior Design & Fit-Out',
    description: 'Transform your space with our premium interior design and fit-out services tailored to your style and needs.',
    features: ['Custom designs', 'Project management', 'Quality materials', 'Timely delivery'],
    link: '/contact',
    highlight: 'Bespoke Design',
  },
]

const investorServices = [
  {
    icon: TrendingUp,
    title: 'Investment Property Acquisition',
    description: 'High-yield investment opportunities with proven ROI potential, comprehensive market analysis, and professional due diligence.',
    features: ['ROI projections', 'Market research', 'Risk assessment', 'Portfolio diversification'],
    link: '/properties',
    highlight: 'High Yield',
  },
  {
    icon: Key,
    title: 'Rental Management',
    description: 'End-to-end tenant management including screening, rent collection, maintenance, and compliance with all regulations.',
    features: ['Tenant screening', 'Rent collection', 'Property maintenance', 'Legal compliance'],
    link: '/contact',
    highlight: 'Passive Income',
  },
  {
    icon: BarChart3,
    title: 'Resale & Exit Strategy',
    description: 'Strategic planning and execution for profitable property exits, market timing, and portfolio rebalancing.',
    features: ['Market timing', 'Buyer identification', 'Price optimization', 'Transaction management'],
    link: '/contact',
    highlight: 'Maximize Returns',
  },
  {
    icon: Wallet,
    title: 'Investment Portfolio Management',
    description: 'Comprehensive management of your real estate investment portfolio with regular performance reporting.',
    features: ['Performance tracking', 'Asset allocation', 'Risk management', 'Tax optimization'],
    link: '/contact',
    highlight: 'Wealth Growth',
  },
]

const corporateServices = [
  {
    icon: Briefcase,
    title: 'Corporate Real Estate Solutions',
    description: 'Tailored real estate solutions for businesses including office space, warehouses, and retail locations.',
    features: ['Lease negotiations', 'Space planning', 'Relocation services', 'Lease renewals'],
    link: '/contact',
    highlight: 'Enterprise',
  },
  {
    icon: ClipboardList,
    title: 'Project Development',
    description: 'From concept to completion, we manage property development projects of all scales with precision.',
    features: ['Feasibility studies', 'Project planning', 'Construction oversight', 'Quality assurance'],
    link: '/contact',
    highlight: 'End-to-End',
  },
]

const sharedServices = [
  {
    icon: Users,
    title: 'Consultation & Planning',
    description: 'Personalized consultation to understand your goals and create a customized real estate strategy.',
    features: ['Goal assessment', 'Custom strategy', 'Financial planning', 'Risk management'],
    link: '/contact',
  },
  {
    icon: FileText,
    title: 'Legal & Documentation',
    description: 'Complete legal support including contract review, title verification, and regulatory compliance.',
    features: ['Contract review', 'Title verification', 'Regulatory compliance', 'Transaction documentation'],
    link: '/contact',
  },
]

export function ServicesList() {
  return (
    <section className="section-container bg-surface relative overflow-hidden">
      {/* Owner Services */}
      <div className="mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4 block">Exclusive Ownership</span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mb-6 tracking-tight">
            For <span className="font-semibold">Luxury Owners</span>
          </h2>
          <p className="text-lg text-text/70 dark:text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
            Premium services designed for discerning property owners seeking excellence in every detail
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ownerServices.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-32" />

      {/* Investor Services */}
      <div className="mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4 block">Wealth Building</span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mb-6 tracking-tight">
            For <span className="font-semibold">Strategic Investors</span>
          </h2>
          <p className="text-lg text-text/70 dark:text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
            Investment-focused services to maximize returns and minimize risks in your real estate portfolio
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {investorServices.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-32" />

      {/* Corporate Services */}
      <div className="mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4 block">Business Solutions</span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mb-6 tracking-tight">
            For <span className="font-semibold">Corporations</span>
          </h2>
          <p className="text-lg text-text/70 dark:text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
            Comprehensive real estate solutions tailored for business needs
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {corporateServices.map((service, index) => (
            <ServiceCard key={service.title} service={service} index={index} />
          ))}
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent mb-32" />

      {/* Shared Services */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent mb-4 block">Foundations</span>
          <h2 className="text-4xl md:text-5xl font-heading font-light mb-6 tracking-tight">
            Core <span className="font-semibold">Capabilities</span>
          </h2>
          <p className="text-lg text-text/70 dark:text-white/70 font-light max-w-2xl mx-auto leading-relaxed">
            Essential services available to all our clients regardless of their investment approach
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
      transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
      className="group relative"
    >
      <Link href={service.link} className="block h-full">
        <div className="h-full p-8 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl transition-all duration-500 flex flex-col hover:bg-white/10 dark:hover:bg-black/30">
          {/* Highlight Badge */}
          {service.highlight && (
            <div className="absolute -top-3 right-6">
              <span className="px-3 py-1 bg-accent text-white text-[10px] font-semibold uppercase tracking-wider rounded-full">
                {service.highlight}
              </span>
            </div>
          )}
          
          {/* Icon */}
          <div className="inline-flex p-4 bg-accent/5 rounded-xl mb-6 transition-all duration-500 self-start group-hover:bg-accent/10">
            <service.icon className="w-6 h-6 text-accent" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-heading font-semibold mb-3 tracking-wide group-hover:text-accent transition-colors duration-300">
            {service.title}
          </h3>
          
          {/* Description */}
          <p className="text-text/70 dark:text-white/70 mb-6 font-light leading-relaxed flex-grow text-sm">
            {service.description}
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-6">
            {service.features.slice(0, 3).map((feature: string) => (
              <li key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent/70 flex-shrink-0" />
                <span className="text-sm text-text/60 dark:text-white/60 font-light">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="flex items-center gap-2 text-accent text-sm font-medium mt-auto pt-4 border-t border-border/20">
            <span>Learn More</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
