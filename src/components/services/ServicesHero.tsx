'use client'

import { motion } from 'framer-motion'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { useEnsureSection } from '@/components/editable/useEnsureSection'
import EditableText from '@/components/editable/EditableText'

export function ServicesHero() {
  const { section, content } = useEnsureSection({
    slug: 'services',
    key: 'hero',
    type: 'HERO',
    defaults: {
      title: 'Comprehensive Real Estate Services',
      subtitle:
        'From acquisition to management and profitable exit, we provide end-to-end solutions tailored to luxury owners and strategic investors.',
    },
  })
  return (
    <section className="relative py-24 overflow-hidden text-text dark:text-white transition-colors duration-500 ease-in-out bg-surface">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface z-0" />
      <div className="absolute -top-64 -right-64 w-[40rem] h-[40rem] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="mb-6 flex justify-center">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Services' }]} />
          </div>
          <EditableText
            sectionId={section?.id || 'pending'}
            path="title"
            value={content?.title || ''}
            as="h1"
            className="text-5xl md:text-6xl lg:text-[4rem] font-heading font-light mb-6 tracking-tight"
          />
          <EditableText
            sectionId={section?.id || 'pending'}
            path="subtitle"
            value={content?.subtitle || ''}
            as="p"
            className="text-xl text-text/70 dark:text-white/70 font-light leading-relaxed max-w-2xl mx-auto mb-12"
          />
          
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold uppercase tracking-[0.15em]">
            <div className="px-6 py-3 bg-white/5 dark:bg-black/20 backdrop-blur-md border border-border/50 rounded-sm">
              Property Acquisition
            </div>
            <div className="px-6 py-3 bg-white/5 dark:bg-black/20 backdrop-blur-md border border-border/50 rounded-sm">
              Investment Advisory
            </div>
            <div className="px-6 py-3 bg-white/5 dark:bg-black/20 backdrop-blur-md border border-border/50 rounded-sm">
              Facility Management
            </div>
            <div className="px-6 py-3 bg-white/5 dark:bg-black/20 backdrop-blur-md border border-border/50 rounded-sm">
              Rental & Resale
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
