import React from 'react'

type Item = {
  id?: string | number
  title?: string
  subtitle?: string
  href?: string
}

type Props = {
  heading?: string
  items?: Item[]
}

export default function Grid({ heading, items = [] }: Props) {
  return (
    <section className="section-container">
      {heading && <h2 className="text-h2 mb-6">{heading}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((it, idx) => (
          <div key={it.id ?? idx} className="property-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-h3 mb-1">{it.title || 'Untitled'}</h3>
                {it.subtitle && <p className="text-sm text-neutral-600 dark:text-neutral-300">{it.subtitle}</p>}
              </div>
              {it.href && (
                <a href={it.href} className="text-primary underline text-sm">View</a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
