import React from 'react'

type Props = {
  heading?: string
  text?: string
  ctaText?: string
  ctaHref?: string
}

export default function TextSection({ heading, text, ctaText, ctaHref }: Props) {
  return (
    <section className="section-container">
      {heading && <h2 className="text-h2 mb-4">{heading}</h2>}
      {text && <p className="max-w-3xl text-lg text-neutral-700 dark:text-neutral-200">{text}</p>}
      {ctaText && (
        <div className="mt-6">
          <a href={ctaHref || '#'} className="btn-primary inline-flex items-center">
            {ctaText}
          </a>
        </div>
      )}
    </section>
  )
}
