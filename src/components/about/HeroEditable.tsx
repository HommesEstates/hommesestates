'use client'

import EditableText from '@/components/editable/EditableText'
import { useEnsureSection } from '@/components/editable/useEnsureSection'

export function AboutHeroEditable() {
  const { section, content } = useEnsureSection({
    slug: 'about',
    key: 'hero',
    type: 'HERO',
    defaults: {
      title: 'About Hommes Estates',
      subtitle:
        'We create spaces that enable ambitious organizations to thrive and investors to grow enduring wealth.',
    },
  })
  return (
    <>
      <EditableText
        sectionId={section?.id || 'pending'}
        path="title"
        value={content?.title || ''}
        as="h1"
        className="text-4xl md:text-6xl font-heading font-bold mb-4"
      />
      <EditableText
        sectionId={section?.id || 'pending'}
        path="subtitle"
        value={content?.subtitle || ''}
        as="p"
        className="text-lg md:text-xl text-text/80 dark:text-white/80 max-w-3xl mx-auto"
      />
    </>
  )
}
