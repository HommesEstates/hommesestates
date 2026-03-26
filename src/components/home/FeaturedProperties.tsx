'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Bed, Bath, Square, TrendingUp, ArrowRight } from 'lucide-react'
import { publicApi } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'
// Using backend data shapes

export function FeaturedProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProperties() {
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
            images: [],
            featured: false,
            investment_ready: status === 'available',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          } as any
        })
      )
      setProperties(enriched)
      setLoading(false)
    }
    fetchProperties()
  }, [])

  if (loading) {
    return (
      <section className="section-container">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="property-card shimmer h-96" />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="section-container bg-surface">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-heading font-bold mb-4"
        >
          Featured <span className="gradient-text">Properties</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-text/70 dark:text-white/70"
        >
          Discover our handpicked selection of premium properties
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {properties.map((property, index) => (
          <PropertyCard key={property.id} property={property} index={index} />
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 px-8 py-4 bg-copper-gradient text-white rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold"
        >
          View All Properties
          <ArrowRight className="w-5 h-5" />
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
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/properties/${property.id}`} className="property-card block">
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={property.images[0] || 'https://via.placeholder.com/600x400'}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {property.investment_ready && (
              <span className="investment-badge">
                <TrendingUp className="w-4 h-4" />
                Investment
              </span>
            )}
            <span
              className={`px-3 py-1 text-white text-xs font-semibold rounded-full ${
                property.status === 'available'
                  ? 'bg-secondary'
                  : property.status === 'sold'
                  ? 'bg-neutral-600'
                  : 'bg-accent'
              }`}
            >
              {property.status.toUpperCase()}
            </span>
          </div>
          <div className="blur-overlay" />
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{property.location}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-heading font-bold mb-2 line-clamp-1">
            {property.name}
          </h3>
          <p className="text-text/70 dark:text-white/70 text-sm mb-4 line-clamp-2">
            {property.description}
          </p>

          {/* Features */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4 text-accent" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4 text-accent" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4 text-accent" />
              <span>
                {property.area} {property.area_unit}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <p className="text-sm text-text/60 dark:text-white/60">
                Price
              </p>
              <p className="text-2xl font-heading font-bold gradient-text">
                {formatCurrency(property.price, property.currency)}
              </p>
            </div>
            {property.investment_ready &&
              property.investment_details?.projected_rental_yield && (
                <div className="text-right">
                  <p className="text-sm text-text/60 dark:text-white/60">
                    Yield
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
