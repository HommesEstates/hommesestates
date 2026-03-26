import React from 'react'
import Hero from './sections/Hero'
import Grid from './sections/Grid'
import TextSection from './sections/Text'

type Section = any

type Props = {
  sections: Section[]
}

export default function SectionRenderer({ sections }: Props) {
  return (
    <div className="space-y-10 md:space-y-16">
      {sections?.map((s: any, idx: number) => {
        const style = s?.layoutStyle || s?._type
        if (style === 'hero') {
          return <Hero key={idx} heading={s.heading} text={s.text} ctaText={s.ctaText} ctaHref={s.ctaHref} media={s.media} />
        }
        if (style === 'grid') {
          return <Grid key={idx} heading={s.heading} items={s.items || []} />
        }
        return <TextSection key={idx} heading={s.heading} text={s.text} ctaText={s.ctaText} ctaHref={s.ctaHref} />
      })}
    </div>
  )
}
