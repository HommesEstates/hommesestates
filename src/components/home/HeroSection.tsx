'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play, TrendingUp } from 'lucide-react'
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
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
        <EditableImage
          sectionId={section?.id || 'pending'}
          path="bgImage"
          src={content?.bgImage || ''}
          alt="Luxury Estate"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 section-container text-center lg:text-left">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <EditableText
              sectionId={section?.id || 'pending'}
              path="title"
              value={content?.title || ''}
              as="h1"
              className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight"
            />
            <EditableText
              sectionId={section?.id || 'pending'}
              path="subtitle"
              value={content?.subtitle || ''}
              as="p"
              className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl"
            />

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/properties?type=office"
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Explore Executive Suites
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/properties?investment_ready=true"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 backdrop-blur-sm text-white border-2 border-white/50 rounded-lg hover:bg-white hover:text-charcoal transition-all duration-300 font-semibold"
              >
                Discover Investment Opportunities
                <TrendingUp className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 p-8 bg-white/10 backdrop-blur-md rounded-2xl"
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
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="w-6 h-10 border-2 border-white/50 rounded-full p-1">
          <div className="w-1 h-3 bg-white rounded-full mx-auto" />
        </div>
      </motion.div>
    </section>
  )
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-heading font-bold text-accent mb-1">
        {number}
      </div>
      <div className="text-sm text-white/80">{label}</div>
    </div>
  )
}
