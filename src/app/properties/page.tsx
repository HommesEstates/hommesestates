'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { Search, SlidersHorizontal, Grid, List, MapPin, Bed, Bath, Square, TrendingUp } from 'lucide-react'
import { fastAPI } from '@/lib/fastapi'
import { formatCurrency } from '@/lib/utils'
import type { PropertyFilter } from '@/types'
import { useEnsureSection } from '@/components/editable/useEnsureSection'
import EditableText from '@/components/editable/EditableText'

export default function PropertiesPage() {
  const hero = useEnsureSection({
    slug: 'properties',
    key: 'hero',
    type: 'HERO',
    defaults: {
      title: 'Our Properties',
      subtitle: 'Discover premium properties for luxury ownership and strategic investment',
    },
  })
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<PropertyFilter>({})

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true)
      const data = await fastAPI.getProperties()
      const list = Array.isArray(data) ? data : []
      const enriched = await Promise.all(
        list.map(async (p: any) => {
          const id = Number(p.id)
          let suites: any[] = []
          try { suites = await fastAPI.getPropertySuites(id) } catch {}
          const available = suites.filter((s: any) => (s?.is_available ?? 1) !== 0)
          const prices = available.map((s: any) => Number(s.list_price || 0)).filter((n: number) => n > 0)
          const sizes = available.map((s: any) => Number(s.area_sqm || 0)).filter((n: number) => n > 0)
          const minPrice = prices.length ? Math.min(...prices) : 0
          const minSize = sizes.length ? Math.min(...sizes) : 0
          const status: any = available.length > 0 ? 'available' : 'sold'
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            property_type: p.property_type || 'commercial',
            location: p.address || p.city || '',
            address: p.address || '',
            price: minPrice,
            currency: 'NGN',
            area: minSize,
            area_unit: 'sqm',
            status,
            images: p.image_url ? [p.image_url] : [],
            featured: false,
            investment_ready: status === 'available',
          }
        })
      )
      setProperties(enriched)
      setLoading(false)
    }
    fetchProperties()
  }, [filters])

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero Section */}
        <section className="text-text dark:text-white py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-4">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Properties' }]} />
              </div>
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="title"
                value={hero.content?.title || ''}
                as="h1"
                className="text-4xl md:text-5xl font-heading font-bold mb-4"
              />
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="subtitle"
                value={hero.content?.subtitle || ''}
                as="p"
                className="text-xl text-text/80 dark:text-white/80 max-w-2xl mx-auto"
              />
            </motion.div>
          </div>
        </section>

        {/* Filters and Controls */}
        <section className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="font-semibold">Filters</span>
                </button>

                <div className="flex items-center gap-2 p-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid'
                        ? 'bg-accent text-white'
                        : 'text-text/60 dark:text-white/60 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list'
                        ? 'bg-accent text-white'
                        : 'text-text/60 dark:text-white/60 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                <span className="text-sm text-text/60 dark:text-white/60">
                  {properties.length} properties found
                </span>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-6 bg-white dark:bg-neutral-800 rounded-lg"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Property Type</label>
                    <select className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">All Types</option>
                      <option value="office">Office</option>
                      <option value="estate">Estate</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Location</label>
                    <select className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">All Locations</option>
                      <option value="lagos">Lagos</option>
                      <option value="abuja">Abuja</option>
                      <option value="port-harcourt">Port Harcourt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Price Range</label>
                    <select className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">Any Price</option>
                      <option value="0-50000000">Under ₦50M</option>
                      <option value="50000000-100000000">₦50M - ₦100M</option>
                      <option value="100000000-200000000">₦100M - ₦200M</option>
                      <option value="200000000+">Above ₦200M</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Investment Ready</label>
                    <select className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">All Properties</option>
                      <option value="true">Investment Only</option>
                      <option value="false">Non-Investment</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setFilters({})}
                    className="px-6 py-2 text-text dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors">
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Properties Grid/List */}
        <section className="section-container">
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="property-card shimmer h-96" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-text/60 dark:text-white/60">No properties found matching your criteria.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}

function PropertyCard({
  property,
  index,
  viewMode,
}: {
  property: any
  index: number
  viewMode: 'grid' | 'list'
}) {
  const fallbackImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="%23e5e7eb"/></svg>'
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link
          href={`/properties/${property.id}`}
          className="flex flex-col md:flex-row gap-6 property-card p-6"
        >
          <div className="relative w-full md:w-80 h-64 flex-shrink-0 overflow-hidden rounded-xl">
            <img
              src={property.images[0] || fallbackImg}
              alt={property.name}
              className="w-full h-full object-cover"
            />
            {property.investment_ready && (
              <span className="absolute top-4 right-4 investment-badge">
                <TrendingUp className="w-4 h-4" />
                Investment
              </span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-heading font-bold">{property.name}</h3>
              <div className="text-right">
                <p className="text-sm text-text/60 dark:text-white/60">From</p>
                <p className="text-3xl font-heading font-bold gradient-text">
                  {formatCurrency(property.price, property.currency)}
                </p>
                {property.investment_ready &&
                  property.investment_details?.projected_rental_yield && (
                    <p className="text-sm text-accent font-semibold">
                      {property.investment_details.projected_rental_yield}% Yield
                    </p>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-text/60 dark:text-white/60 mb-4">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{property.location}</span>
            </div>

            <p className="text-text/70 dark:text-white/70 mb-6 line-clamp-2">
              {property.description}
            </p>

            <div className="flex items-center gap-6 text-sm">
              {property.bedrooms && (
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-accent" />
                  <span>{property.bedrooms} Beds</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-accent" />
                  <span>{property.bathrooms} Baths</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Square className="w-5 h-5 text-accent" />
                <span>
                  {property.area} {property.area_unit}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  // Grid view (reuse from FeaturedProperties)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/properties/${property.id}`} className="property-card block">
        <div className="relative h-64 overflow-hidden">
          <img
            src={property.images[0] || fallbackImg}
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
                  : 'bg-neutral-600'
              }`}
            >
              {property.status === 'available' ? 'AVAILABLE' : 'SOLD OUT'}
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

        <div className="p-6">
          <h3 className="text-xl font-heading font-bold mb-2 line-clamp-1">
            {property.name}
          </h3>
          <p className="text-text/70 dark:text-white/70 text-sm mb-4 line-clamp-2">
            {property.description}
          </p>

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
                From {property.area} {property.area_unit}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <p className="text-sm text-text/60 dark:text-white/60">From</p>
              <p className="text-2xl font-heading font-bold gradient-text">{formatCurrency(property.price, property.currency)}</p>
            </div>
            {property.investment_ready &&
              property.investment_details?.projected_rental_yield && (
                <div className="text-right">
                  <p className="text-sm text-text/60 dark:text-white/60">Yield</p>
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
