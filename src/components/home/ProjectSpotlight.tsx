'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Building2, MapPin, Download, CheckCircle } from 'lucide-react'

interface ProjectSpotlightProps {
  status: 'selling' | 'sold'
}

export function ProjectSpotlight({ status }: ProjectSpotlightProps) {
  const isSelling = status === 'selling'
  
  const project = isSelling ? {
    name: 'The Fusion Wuse',
    location: 'Sultan Abubakar Way, Wuse, Abuja',
    units: '426 units',
    blocks: '3 blocks',
    floors: '15 floors',
    description: 'Premium executive office suites in the heart of Abuja\'s business district',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
    slug: 'fusion-wuse',
    features: [
      'Prime CBD Location',
      'State-of-the-art Facilities',
      'Flexible Suite Layouts',
      'High Investment Yield (12-15% p.a.)',
      '24/7 Security & Power',
      'Ample Parking Space'
    ]
  } : {
    name: 'The Fusion Wuye',
    location: 'Plot 312, Olusegun Obasanjo Way, Wuye, Abuja',
    units: '380 units',
    blocks: '2 blocks',
    floors: '12 floors',
    description: 'Successfully completed and fully occupied premium business suites',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    slug: 'fusion-wuye',
    testimonial: '"The structure design is top-notch... The location sells this place. Best investment decision I made in 2023."',
    testimonialAuthor: 'Dr. Chukwuma Okafor, Suite Owner'
  }

  return (
    <section className={`section-container ${isSelling ? 'bg-surface' : 'bg-muted'}`}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Status Badge */}
        <div className="absolute top-6 right-6 z-10">
          <span className={`px-6 py-3 rounded-full font-semibold text-sm ${
            isSelling 
              ? 'bg-accent text-white' 
              : 'bg-secondary text-white'
          }`}>
            {isSelling ? '🔥 Currently Selling' : '✓ Completed & Sold Out'}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative h-96 lg:h-auto">
            <img
              src={project.image}
              alt={project.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Content Section */}
          <div className="p-8 lg:p-12 flex flex-col justify-center bg-surface">
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4">
              {project.name}
            </h2>
            
            <div className="flex items-center gap-2 text-text/60 dark:text-white/60 mb-6">
              <MapPin className="w-5 h-5" />
              <span>{project.location}</span>
            </div>

            <p className="text-lg text-text/70 dark:text-white/70 mb-8">
              {project.description}
            </p>

            {/* Project Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-heading font-bold text-accent">{project.units}</p>
                <p className="text-sm text-text/60 dark:text-white/60">Total Units</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-heading font-bold text-accent">{project.blocks}</p>
                <p className="text-sm text-text/60 dark:text-white/60">Blocks</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-heading font-bold text-accent">{project.floors}</p>
                <p className="text-sm text-text/60 dark:text-white/60">Floors</p>
              </div>
            </div>

            {/* Features or Testimonial */}
            {isSelling ? (
              <div className="space-y-3 mb-8">
                {project.features?.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-text/80 dark:text-white/80">{feature}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-accent/10 border-l-4 border-accent rounded-lg mb-8">
                <p className="text-lg italic text-text/80 dark:text-white/80 mb-3">
                  {project.testimonial}
                </p>
                <p className="text-sm font-semibold text-text/70 dark:text-white/70">
                  — {project.testimonialAuthor}
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isSelling ? (
                <>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-copper-gradient text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                  >
                    <Building2 className="w-5 h-5" />
                    View Floor Plans
                  </Link>
                  <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-accent text-accent rounded-lg hover:bg-accent hover:text-white transition-all duration-300 font-semibold">
                    <Download className="w-5 h-5" />
                    Investment Brochure
                  </button>
                </>
              ) : (
                <Link
                  href="/projects"
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-charcoal text-white dark:bg-white dark:text-charcoal rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
                >
                  Explore Upcoming Projects
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
