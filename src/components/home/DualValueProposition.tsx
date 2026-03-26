'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Building2, TrendingUp, ArrowRight } from 'lucide-react'

export function DualValueProposition() {
  return (
    <section className="section-container">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Luxury Ownership Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="group relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"
              alt="Premium Executive Suite"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          </div>

          <div className="relative z-10 p-8 lg:p-12 min-h-[500px] flex flex-col justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 self-start">
              <Building2 className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">For Business Leaders</span>
            </div>

            <h3 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
              Premium Executive Suites
            </h3>

            <p className="text-lg text-white/90 mb-6">
              For corporations and business leaders who demand space that reflects their stature. 
              Ultra-modern facilities in Abuja's most prestigious business districts.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                'Prime CBD locations',
                'State-of-the-art infrastructure',
                'Flexible suite configurations',
                'Full facility management included',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-white/90">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/properties?type=office"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-charcoal rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold self-start"
            >
              Explore Executive Suites
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>

        {/* Investment Opportunities Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="group relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
              alt="Investment Opportunities"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-accent via-accent/80 to-accent/40" />
          </div>

          <div className="relative z-10 p-8 lg:p-12 min-h-[500px] flex flex-col justify-end">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 self-start">
              <TrendingUp className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">For Investors</span>
            </div>

            <h3 className="text-3xl lg:text-4xl font-heading font-bold text-white mb-4">
              High-Yield Property Investments
            </h3>

            <p className="text-lg text-white/90 mb-6">
              Secure, scalable, and profitable. Buy now to rent or resell for maximum return. 
              Professional management ensures consistent income and value appreciation.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                '12-15% annual rental yield',
                '8-10% capital appreciation',
                '40-50% resale premium (5-7 years)',
                'Full property management',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-white/90">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/properties?investment_ready=true"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold self-start"
            >
              Discover Investment Opportunities
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
