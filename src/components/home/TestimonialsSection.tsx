'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
type Testimonial = { id: string; name: string; role?: string | null; company?: string | null; quote: string; rating?: number | null; avatarUrl?: string | null }

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [activeTab, setActiveTab] = useState<'investor' | 'owner'>('investor')

  useEffect(() => {
    let mounted = true
    async function fetchTestimonials() {
      try {
        const res = await fetch('/api/testimonials?active=1', { cache: 'no-store' })
        if (!mounted) return
        const data = await res.json()
        setTestimonials(Array.isArray(data) ? data : [])
      } catch {
        if (!mounted) return
        setTestimonials([])
      }
    }
    fetchTestimonials()
    return () => { mounted = false }
  }, [activeTab])

  const isEmpty = testimonials.length === 0

  return (
    <section className="section-container bg-surface text-text dark:text-white transition-colors duration-500 ease-in-out">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-heading font-bold mb-4"
        >
          Client <span className="text-accent">Success Stories</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-text/70 dark:text-white/70"
        >
          Hear from our satisfied clients and successful investors
        </motion.p>

        {/* Tab Switcher */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => setActiveTab('investor')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'investor'
                ? 'bg-accent text-white'
                : 'bg-muted text-text/80 hover:opacity-90 dark:bg-muted dark:text-white/80'
            }`}
          >
            Investor Testimonials
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              activeTab === 'owner'
                ? 'bg-accent text-white'
                : 'bg-muted text-text/80 hover:opacity-90 dark:bg-muted dark:text-white/80'
            }`}
          >
            Owner Testimonials
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isEmpty && (
          <div className="md:col-span-2 lg:col-span-3 p-8 bg-surface rounded-2xl text-center">
            <p className="text-text/80 dark:text-white/80">No testimonials available right now.</p>
            <p className="text-text/60 dark:text-white/60 text-sm mt-1">Please check back later.</p>
          </div>
        )}
        {(Array.isArray(testimonials) ? testimonials : []).map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="p-8 rounded-2xl transition-all duration-300 bg-surface shadow-[0_8px_30px_rgba(204,85,0,0.05)] hover:shadow-[0_12px_40px_rgba(204,85,0,0.10)] hover:-translate-y-1"
          >
            <Quote className="w-10 h-10 text-accent mb-4" />
            
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < (testimonial.rating ?? 5)
                      ? 'text-accent fill-accent'
                      : 'text-white/30'
                  }`}
                />
              ))}
            </div>

            <p className="text-text/90 dark:text-white/90 leading-relaxed mb-6 italic">
              "{testimonial.quote}"
            </p>

            <div className="flex items-center gap-4">
              {testimonial.avatarUrl && (
                <img
                  src={testimonial.avatarUrl}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-text dark:text-white">{testimonial.name}</p>
                <p className="text-sm text-text/70 dark:text-white/70">
                  {testimonial.role}
                  {testimonial.company && ` - ${testimonial.company}`}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
