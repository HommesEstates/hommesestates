'use client'

import { motion } from 'framer-motion'
import { Download, Calendar, MapPin, TrendingUp } from 'lucide-react'
import Image from 'next/image'

interface ProjectHeroProps {
  projectName: string
  tagline: string
  location: string
  status: string
  heroImage: string
  ctaPrimary: string
  ctaSecondary: string
}

export function ProjectHero({
  projectName,
  tagline,
  location,
  status,
  heroImage,
  ctaPrimary,
  ctaSecondary
}: ProjectHeroProps) {
  const handleDownloadBrochure = () => {
    // Production: Trigger PDF download
    window.open('/api/projects/fusion-wuse/brochure.pdf', '_blank')
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'download_brochure', {
        project_name: projectName,
      })
    }
  }

  const handleScheduleTour = () => {
    // Production: Open schedule modal
    const modal = document.getElementById('schedule-tour-modal')
    if (modal) {
      modal.classList.remove('hidden')
    }
  }

  return (
    <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt={projectName}
          fill
          className="object-cover"
          style={{ objectPosition: 'center' }}
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full mb-6"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{status}</span>
          </motion.div>

          {/* Project Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-hero font-heading font-bold mb-4"
          >
            {projectName}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-light mb-6 text-white/90"
          >
            {tagline}
          </motion.p>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 text-lg mb-8 text-white/80"
          >
            <MapPin className="w-5 h-5" />
            <span>{location}</span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={handleDownloadBrochure}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-copper-gradient text-white rounded-xl font-accent font-semibold hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Download className="w-5 h-5" />
              {ctaPrimary}
            </button>
            <button
              onClick={handleScheduleTour}
              className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-xl font-accent font-semibold hover:bg-white hover:text-charcoal transition-all"
            >
              <Calendar className="w-5 h-5" />
              {ctaSecondary}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2"
        >
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}
