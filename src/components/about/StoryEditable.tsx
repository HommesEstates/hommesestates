'use client'

import EditableRichText from '@/components/editable/EditableRichText'
import EditableImage from '@/components/editable/EditableImage'
import { useEnsureSection } from '@/components/editable/useEnsureSection'

export function StoryEditable() {
  const { section, content } = useEnsureSection({
    slug: 'about',
    key: 'story',
    type: 'TEXT_BLOCK',
    defaults: {
      image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=2000',
      html: 'From our beginnings in Abuja to serving clients across Nigeria, we have consistently delivered premium executive suites and yield-generating investments. Our integrated model combines acquisition, development oversight, and world-class facility management.',
    },
  })
  return (
    <div className="grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <div className="relative h-80 md:h-[28rem] rounded-3xl overflow-hidden">
          <EditableImage
            sectionId={section?.id || 'pending'}
            path="image"
            src={content?.image || ''}
            alt="Our Story"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      </div>
      <div>
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Our Story</h2>
        <EditableRichText
          sectionId={section?.id || 'pending'}
          path="html"
          html={content?.html || ''}
          className="prose dark:prose-invert max-w-none mb-6"
        />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-3xl font-heading font-bold text-accent">15+</p>
            <p className="text-sm text-text/60 dark:text-white/60">Years Experience</p>
          </div>
          <div>
            <p className="text-3xl font-heading font-bold text-accent">₦120B+</p>
            <p className="text-sm text-text/60 dark:text-white/60">Portfolio Value</p>
          </div>
          <div>
            <p className="text-3xl font-heading font-bold text-accent">98%</p>
            <p className="text-sm text-text/60 dark:text-white/60">Client Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  )
}
