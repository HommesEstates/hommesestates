'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Building2, TrendingUp, ArrowRight } from 'lucide-react'

export function DualValueProposition() {
  return (
    <section className="section-container">
      <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
        {/* Luxury Ownership Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="group relative overflow-hidden rounded-md"
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"
              alt="Premium Executive Suite"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          </div>

          <div className="relative z-10 p-10 lg:p-14 min-h-[600px] flex flex-col justify-end">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-black/20 backdrop-blur-md border border-white/20 rounded-sm mb-8 self-start">
              <Building2 className="w-4 h-4 text-accent" />
              <span className="text-white text-xs font-semibold uppercase tracking-[0.15em]">For Business Leaders</span>
            </div>

            <h3 className="text-3xl lg:text-5xl font-heading font-light text-white mb-6 tracking-tight">
              Premium Executive Suites
            </h3>

            <p className="text-base text-white/70 mb-10 font-light leading-relaxed max-w-lg">
              For corporations and business leaders who demand space that reflects their stature. 
              Ultra-modern facilities in Abuja's most prestigious business districts.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                'Prime CBD locations',
                'State-of-the-art infrastructure',
                'Flexible suite configurations',
                'Full facility management included',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-4 text-white/80 font-light text-sm">
                  <div className="w-1 h-1 rounded-full bg-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/properties?type=office"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black hover:bg-accent hover:text-white transition-all duration-500 font-semibold text-xs uppercase tracking-[0.15em] self-start rounded-sm"
            >
              Explore Executive Suites
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Investment Opportunities Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="group relative overflow-hidden rounded-md"
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
              alt="Investment Opportunities"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-accent/60 to-accent/20" />
          </div>

          <div className="relative z-10 p-10 lg:p-14 min-h-[600px] flex flex-col justify-end">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-black/20 backdrop-blur-md border border-white/20 rounded-sm mb-8 self-start">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-semibold uppercase tracking-[0.15em]">For Investors</span>
            </div>

            <h3 className="text-3xl lg:text-5xl font-heading font-light text-white mb-6 tracking-tight">
              High-Yield Investments
            </h3>

            <p className="text-base text-white/80 mb-10 font-light leading-relaxed max-w-lg">
              Secure, scalable, and profitable. Buy now to rent or resell for maximum return. 
              Professional management ensures consistent income and value appreciation.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                '12-15% annual rental yield',
                '8-10% capital appreciation',
                '40-50% resale premium (5-7 years)',
                'Full property management',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-4 text-white/90 font-light text-sm">
                  <div className="w-1 h-1 rounded-full bg-white" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/properties?investment_ready=true"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black hover:bg-accent hover:text-white transition-all duration-500 font-semibold text-xs uppercase tracking-[0.15em] self-start rounded-sm"
            >
              Discover Opportunities
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
