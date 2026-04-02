'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Bed, Bath, Square, TrendingUp, ArrowRight } from 'lucide-react'
import { publicApi } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'

export function FeaturedProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProperties() {
      try {
        const list = await publicApi.listProperties()
        const enriched = await Promise.all(
          (Array.isArray(list) ? list : []).slice(0, 6).map(async (p: any) => {
            const id = Number(p.id)
            let suites: any[] = []
            try { suites = await publicApi.listPropertySuites(id) } catch {}
            const available = suites.filter((s: any) => (s?.is_available ?? 1) !== 0)
            const prices = available.map((s: any) => Number(s.list_price || 0)).filter((n: number) => n > 0)
            const sizes = available.map((s: any) => Number(s.area_sqm || 0)).filter((n: number) => n > 0)
            const minPrice = prices.length ? Math.min(...prices) : 0
            const minSize = sizes.length ? Math.min(...sizes) : 0
            const status: 'available' | 'sold' = available.length > 0 ? 'available' : 'sold'
            return {
              id: p.id,
              name: p.name,
              description: p.description || '',
              property_type: p.property_type || 'commercial',
              location: p.address || '',
              address: p.address || '',
              price: minPrice,
              currency: 'NGN',
              area: minSize,
              area_unit: 'sqm',
              status,
              images: p.images || [],
              featured: false,
              investment_ready: status === 'available',
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
            } as any
          })
        )
        setProperties(enriched)
      } catch (error) {
        console.error('Failed to fetch properties:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [])

  if (loading) {
    return (
      <section className="section-container bg-surface/50">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md bg-white/5 border border-border/50 animate-pulse h-[500px]" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="section-container bg-surface">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-heading font-light mb-4 tracking-tight"
          >
            Featured <span className="gradient-text font-bold">Properties</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-text/70 dark:text-white/70 font-light"
          >
            Discover our handpicked selection of premium properties
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <Link
            href="/properties"
            className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-transparent border border-accent/30 text-accent hover:bg-accent hover:text-white transition-all duration-500 font-medium text-xs uppercase tracking-[0.15em] rounded-sm"
          >
            View All Properties
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {properties.map((property, index) => (
          <PropertyCard key={property.id} property={property} index={index} />
        ))}
      </div>

      <div className="text-center md:hidden">
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-accent text-accent hover:bg-accent hover:text-white transition-all duration-500 font-medium text-xs uppercase tracking-[0.15em] rounded-sm w-full justify-center"
        >
          View All Properties
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}

function PropertyCard({
  property,
  index,
}: {
  property: any
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
    >
      <Link href={`/properties/${property.id}`} className="property-card block h-full flex flex-col">
        {/* Image */}
        <div className="relative h-72 overflow-hidden bg-black/5">
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {property.investment_ready && (
              <span className="investment-badge">
                <TrendingUp className="w-3.5 h-3.5" />
                Investment
              </span>
            )}
            <span
              className={`px-3 py-1.5 text-white text-[10px] uppercase tracking-[0.2em] font-semibold rounded-sm backdrop-blur-md ${
                property.status === 'available'
                  ? 'bg-secondary/90 border border-secondary/50'
                  : property.status === 'sold'
                  ? 'bg-black/80 border border-white/20'
                  : 'bg-accent/90 border border-accent/50'
              }`}
            >
              {property.status}
            </span>
          </div>
          <div className="blur-overlay opacity-80" />
          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm font-light tracking-wide truncate">{property.location}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-grow flex flex-col">
          <h3 className="text-xl font-heading font-semibold mb-3 line-clamp-1 tracking-tight group-hover:text-accent transition-colors duration-300">
            {property.name}
          </h3>
          <p className="text-text/60 dark:text-white/60 text-sm mb-6 line-clamp-2 font-light leading-relaxed flex-grow">
            {property.description || 'Experience premium real estate with unparalleled amenities and strategic location.'}
          </p>

          {/* Features */}
          <div className="flex items-center gap-6 mb-8 text-sm font-light text-text/70 dark:text-white/70 border-b border-border/50 pb-6">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-accent/70" />
                <span>{property.bedrooms} Beds</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bath className="w-4 h-4 text-accent/70" />
                <span>{property.bathrooms} Baths</span>
              </div>
            )}
            {property.area > 0 && (
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4 text-accent/70" />
                <span>
                  {property.area} {property.area_unit}
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 mb-1 font-semibold">
                Starting From
              </p>
              <p className="text-2xl font-heading font-bold text-text dark:text-white tracking-tight">
                {property.price > 0 ? formatCurrency(property.price, property.currency) : 'Contact Us'}
              </p>
            </div>
            {property.investment_ready &&
              property.investment_details?.projected_rental_yield && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 mb-1 font-semibold">
                    Proj. Yield
                  </p>
                  <p className="text-lg font-bold text-accent">
                    {property.investment_details.projected_rental_yield}%
                  </p>
                </div>
              )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
