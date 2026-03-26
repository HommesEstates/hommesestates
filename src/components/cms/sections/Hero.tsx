import React from 'react'
import { urlFor } from '@/lib/sanityImage'

type Props = {
  heading?: string
  text?: string
  ctaText?: string
  ctaHref?: string
  media?: any
}

export default function Hero({ heading, text, ctaText, ctaHref, media }: Props) {
  const bgUrl = media ? urlFor(media)?.width(1600).height(900).fit('crop').url() : null
  return (
    <section className="relative overflow-hidden rounded-2xl bg-surface dark:bg-neutral-900 shadow-lg">
      {bgUrl && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgUrl} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
      <div className="relative px-6 py-20 md:px-12 md:py-28">
        {heading && (
          <h1 className="text-hero gradient-text drop-shadow-sm mb-6">
            {heading}
          </h1>
        )}
        {text && <p className="max-w-2xl text-lg md:text-xl text-neutral-700 dark:text-neutral-200 mb-8">{text}</p>}
        {ctaText && (
          <a href={ctaHref || '#'} className="btn-primary inline-flex items-center">
            {ctaText}
          </a>
        )}
      </div>
    </section>
  )
}
