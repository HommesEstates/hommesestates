"use client"

import EditableText from '@/components/editable/EditableText'
import { useEnsureSection } from '@/components/editable/useEnsureSection'

export function TextBlockEditable({ slug, keyName, defaults, className = '' }: { slug: string; keyName: string; defaults: { title: string; text: string }; className?: string }) {
  const { section, content } = useEnsureSection({ slug, key: keyName, type: 'TEXT_BLOCK', defaults })
  return (
    <div className={className}>
      <EditableText
        sectionId={section?.id || 'pending'}
        path="title"
        value={content?.title || ''}
        as="h3"
        className="text-2xl md:text-3xl font-heading font-bold mb-3"
      />
      <EditableText
        sectionId={section?.id || 'pending'}
        path="text"
        value={content?.text || ''}
        as="p"
        className="text-text/80 dark:text-white/85 leading-relaxed"
      />
    </div>
  )
}
