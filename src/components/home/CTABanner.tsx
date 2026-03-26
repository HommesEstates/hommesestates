'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'
import { useEnsureSection } from '@/components/editable/useEnsureSection'
import EditableText from '@/components/editable/EditableText'

export function CTABanner() {
  const { section, content } = useEnsureSection({
    slug: 'home',
    key: 'cta',
    type: 'CTA',
    defaults: {
      title: 'Start Your Investment Journey with Hommes Estates',
      subtitle:
        "Whether you're looking to own a luxury property or build wealth through strategic real estate investments, we're here to guide you every step of the way.",
    },
  })
  return (
    <section className="section-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-copper-gradient p-12 md:p-16 text-center"
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <EditableText
            sectionId={section?.id || 'pending'}
            path="title"
            value={content?.title || ''}
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6"
          />
          <EditableText
            sectionId={section?.id || 'pending'}
            path="subtitle"
            value={content?.subtitle || ''}
            as="p"
            className="text-xl text-white/90 mb-8"
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
            >
              View Properties
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-accent transition-all duration-300 font-semibold"
            >
              <Calendar className="w-5 h-5" />
              Schedule Consultation
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
