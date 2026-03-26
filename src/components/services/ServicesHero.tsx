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
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="mb-4">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Services' }]} />
          </div>
          <EditableText
            sectionId={section?.id || 'pending'}
            path="title"
            value={content?.title || ''}
            as="h1"
            className="text-5xl md:text-6xl font-heading font-bold mb-6"
          />
          <EditableText
            sectionId={section?.id || 'pending'}
            path="subtitle"
            value={content?.subtitle || ''}
            as="p"
            className="text-xl text-text/80 dark:text-white/80 mb-8"
          />
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full">
              🏢 Property Acquisition
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full">
              📈 Investment Advisory
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full">
              🔧 Facility Management
            </div>
            <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full">
              💰 Rental & Resale
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
