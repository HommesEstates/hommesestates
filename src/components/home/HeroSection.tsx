'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { useEnsureSection } from '@/components/editable/useEnsureSection'
import EditableText from '@/components/editable/EditableText'
import EditableImage from '@/components/editable/EditableImage'

export function HeroSection() {
  const { section, content } = useEnsureSection({
    slug: 'home',
    key: 'hero',
    type: 'HERO',
    defaults: {
      title: 'Elevate Your Business. Amplify Your Investment.',
      subtitle:
        'Premium Executive Suites & Strategic Property Investments by Hommes Estates. Building spaces that inspire confidence across Africa.',
      bgImage:
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075',
    },
  })
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <EditableImage
          sectionId={section?.id || 'pending'}
          path="bgImage"
          src={content?.bgImage || ''}
          alt="Luxury Estate"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 text-left">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <span className="inline-block text-accent uppercase tracking-[0.2em] text-xs font-semibold">
                Hommes Estates & Facilities Management
              </span>
              <EditableText
                sectionId={section?.id || 'pending'}
                path="title"
                value={content?.title || ''}
                as="h1"
                className="text-5xl md:text-6xl lg:text-[5rem] font-heading font-bold text-white leading-[1.1] tracking-tight"
              />
            </div>
            
            <EditableText
              sectionId={section?.id || 'pending'}
              path="subtitle"
              value={content?.subtitle || ''}
              as="p"
              className="text-xl md:text-2xl text-white/80 max-w-2xl font-light leading-relaxed tracking-wide"
            />

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <Link
                href="/properties?type=office"
                className="btn-primary inline-flex items-center justify-center gap-3 px-10 py-5 text-sm uppercase tracking-[0.1em]"
              >
                Explore Executive Suites
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/properties?investment_ready=true"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-transparent backdrop-blur-sm text-white border border-white/30 rounded-sm hover:bg-white/10 hover:border-white transition-all duration-500 font-medium text-sm uppercase tracking-[0.1em]"
              >
                Investment Opportunities
                <TrendingUp className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mt-24 pt-12 border-t border-white/20"
          >
            <StatItem number="300+" label="Properties Managed" />
            <StatItem number="$120M" label="Assets Under Management" />
            <StatItem number="15+" label="Years of Excellence" />
            <StatItem number="98%" label="Client Satisfaction" />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 hidden md:block"
      >
        <div className="w-5 h-8 border border-white/40 rounded-full p-1 flex justify-center">
          <div className="w-1 h-2 bg-white/70 rounded-full" />
        </div>
      </motion.div>
    </section>
  )
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-left">
      <div className="text-3xl md:text-4xl font-heading font-light text-white mb-2 tracking-tight">
        {number}
      </div>
      <div className="text-xs text-white/60 uppercase tracking-[0.15em] font-medium">{label}</div>
    </div>
  )
}
