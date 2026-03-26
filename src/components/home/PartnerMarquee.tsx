'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion'

type Partner = { id?: string; name: string; logoUrl?: string; website?: string }

const fallbackPartners: Partner[] = [
  { name: 'Federal Capital Territory Administration' },
  { name: 'Central Bank of Nigeria' },
  { name: 'Nigeria Investment Promotion Commission' },
  { name: 'PwC Nigeria' },
  { name: 'Deloitte' },
  { name: 'KPMG' },
  { name: 'Access Bank' },
  { name: 'GTBank' },
]

export function PartnerMarquee() {
  const [isPaused, setIsPaused] = useState(false)
  const [partners, setPartners] = useState<Partner[]>([])
  const baseVelocity = -50 // pixels per second
  const x = useMotionValue(0)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/partners?active=1', { cache: 'no-store' })
        if (!mounted) return
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setPartners(Array.isArray(data) && data.length ? data : fallbackPartners)
      } catch {
        if (!mounted) return
        setPartners(fallbackPartners)
      }
    })()
    return () => { mounted = false }
  }, [])

  useAnimationFrame((t, delta) => {
    if (!isPaused) {
      const moveBy = (baseVelocity * delta) / 1000
      x.set(x.get() + moveBy)
      if (x.get() <= -50) x.set(0)
    }
  })

  const duplicated = useMemo(() => [...partners, ...partners], [partners])

  return (
    <section className="py-16 bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <h2 className="text-center text-2xl md:text-3xl font-heading font-semibold text-text/60">
          Trusted by Leading Organizations
        </h2>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface to-transparent z-10" />

        <motion.div
          className="flex gap-16"
          style={{ x }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          {duplicated.map((p, index) => (
            <a
              key={`${p.name}-${index}`}
              href={p.website || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 group"
              tabIndex={0}
              aria-label={`Visit ${p.name} website`}
            >
              <div className="w-40 h-24 flex items-center justify-center relative">
                <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg group-hover:bg-white dark:group-hover:bg-charcoal transition-all duration-300 group-hover:shadow-lg">
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logoUrl} alt={p.name} className="max-h-12 object-contain" />
                  ) : (
                    <div className="text-text/40 group-hover:text-accent transition-colors duration-300 text-xs font-accent text-center px-4">
                      {p.name.split(' ').slice(0, 2).join(' ')}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-copper-gradient opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300" />
              </div>
            </a>
          ))}
        </motion.div>

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isPaused ? 'Carousel paused' : 'Carousel playing'}
        </div>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .flex {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}
