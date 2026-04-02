'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { Search, SlidersHorizontal, Grid, List, MapPin, Bed, Bath, Square, TrendingUp, ArrowRight } from 'lucide-react'
import { publicApi } from '@/lib/backend'
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
      const list = await publicApi.listProperties()
      const enriched = await Promise.all(
        (Array.isArray(list) ? list : []).map(async (p: any) => {
          const id = Number(p.id)
          let suites: any[] = []
          try { suites = await publicApi.listPropertySuites(id) } catch {}
          const available = suites.filter((s: any) => (s?.is_available ?? 1) !== 0)
          const prices = available.map((s: any) => Number(s.list_price || s.price || 0)).filter((n: number) => n > 0)
          const sizes = available.map((s: any) => Number(s.area_sqm || s.area || 0)).filter((n: number) => n > 0)
          const minPrice = prices.length ? Math.min(...prices) : (p.price_from || p.price || 0)
          const minSize = sizes.length ? Math.min(...sizes) : 0
          const status: any = available.length > 0 || (p.available_suites || 0) > 0 ? 'available' : 'sold'
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            property_type: p.property_type || 'commercial',
            location: p.city || p.address || p.location || '',
            address: p.address || p.city || '',
            price: minPrice,
            currency: p.currency || 'NGN',
            area: minSize,
            area_unit: 'sqm',
            status,
            images: p.main_image_url || p.image_url ? [p.main_image_url || p.image_url] : (p.images || []),
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
      <main className="min-h-screen pt-24">
        {/* Hero Section */}
        <section className="text-text dark:text-white py-20 bg-surface relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface z-0" />
          <div className="absolute -top-64 -right-64 w-[40rem] h-[40rem] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl"
            >
              <div className="mb-6">
                <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Properties' }]} />
              </div>
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="title"
                value={hero.content?.title || ''}
                as="h1"
                className="text-5xl md:text-6xl lg:text-[4rem] font-heading font-light mb-6 tracking-tight"
              />
              <EditableText
                sectionId={hero.section?.id || 'pending'}
                path="subtitle"
                value={hero.content?.subtitle || ''}
                as="p"
                className="text-xl text-text/70 dark:text-white/70 max-w-2xl font-light leading-relaxed"
              />
            </motion.div>
          </div>
        </section>

        {/* Filters and Controls */}
        <section className="bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-24 z-40 shadow-lg">
          <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 py-6">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 w-full lg:max-w-xl">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search exclusive properties..."
                  className="w-full pl-14 pr-6 py-4 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-light text-sm placeholder:text-text/40 dark:placeholder:text-white/40"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-6 w-full lg:w-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-transparent hover:bg-surface text-accent transition-all duration-300 rounded-xl"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.15em]">Filters</span>
                </button>

                <div className="flex items-center p-1 bg-surface rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-colors duration-300 ${
                      viewMode === 'grid'
                        ? 'bg-text dark:bg-white text-white dark:text-black shadow-sm'
                        : 'text-text/50 dark:text-white/50 hover:text-text dark:hover:text-white'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-colors duration-300 ${
                      viewMode === 'list'
                        ? 'bg-text dark:bg-white text-white dark:text-black shadow-sm'
                        : 'text-text/50 dark:text-white/50 hover:text-text dark:hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="mt-8 pt-8 overflow-hidden"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Property Type</label>
                    <select className="w-full px-5 py-3.5 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 font-light text-sm appearance-none">
                      <option value="">All Types</option>
                      <option value="office">Office Space</option>
                      <option value="estate">Estate</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Location</label>
                    <select className="w-full px-5 py-3.5 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 font-light text-sm appearance-none">
                      <option value="">All Locations</option>
                      <option value="lagos">Lagos</option>
                      <option value="abuja">Abuja</option>
                      <option value="port-harcourt">Port Harcourt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Price Range</label>
                    <select className="w-full px-5 py-3.5 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 font-light text-sm appearance-none">
                      <option value="">Any Price</option>
                      <option value="0-50000000">Under ₦50M</option>
                      <option value="50000000-100000000">₦50M - ₦100M</option>
                      <option value="100000000-200000000">₦100M - ₦200M</option>
                      <option value="200000000+">Above ₦200M</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-text/60 dark:text-white/60 mb-3">Investment Ready</label>
                    <select className="w-full px-5 py-3.5 bg-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 font-light text-sm appearance-none">
                      <option value="">All Properties</option>
                      <option value="true">Investment Only</option>
                      <option value="false">Non-Investment</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-10">
                  <span className="text-xs text-text/50 dark:text-white/50 tracking-wide">
                    Showing <strong className="text-text dark:text-white">{properties.length}</strong> exclusive properties
                  </span>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFilters({})}
                      className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-text/60 dark:text-white/60 hover:text-text dark:hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                    <button className="px-8 py-3 bg-text dark:bg-white text-white dark:text-black hover:bg-accent dark:hover:bg-accent hover:text-white transition-colors duration-500 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]">
                      Apply Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Properties Grid/List */}
        <section className="section-container bg-surface min-h-[50vh]">
          {!showFilters && (
            <div className="mb-10 text-sm text-text/50 dark:text-white/50 tracking-wide pb-6">
              Showing <strong className="text-text dark:text-white">{properties.length}</strong> exclusive properties
            </div>
          )}
          
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-8'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-[500px]" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-32 bg-white/5 rounded-2xl">
              <p className="text-xl text-text/60 dark:text-white/60 font-light mb-4">No properties found matching your criteria.</p>
              <button
                onClick={() => setFilters({})}
                className="text-accent hover:text-accent-dark transition-colors text-sm font-semibold uppercase tracking-[0.15em]"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-8'}>
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
  const fallbackImg = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
  
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.6, ease: "easeOut" }}
      >
        <Link
          href={`/properties/${property.id}`}
          className="flex flex-col lg:flex-row property-card overflow-hidden group transition-all duration-500"
        >
          <div className="relative w-full lg:w-2/5 h-72 lg:h-auto overflow-hidden bg-black/5">
            <img
              src={property.images[0] || fallbackImg}
              alt={property.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500"
            />
            <div className="absolute top-5 right-5 flex flex-col gap-2 items-end">
              {property.investment_ready && (
                <span className="investment-badge shadow-lg">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Investment
                </span>
              )}
              <span
                className={`px-3 py-1.5 text-white text-[10px] uppercase tracking-[0.2em] font-semibold rounded-xl backdrop-blur-md shadow-lg ${
                  property.status === 'available'
                    ? 'bg-secondary/90'
                    : property.status === 'sold'
                    ? 'bg-black/80'
                    : 'bg-accent/90'
                }`}
              >
                {property.status === 'available' ? 'AVAILABLE' : 'SOLD OUT'}
              </span>
            </div>
            <div className="blur-overlay opacity-50" />
            <div className="absolute bottom-5 left-5">
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="text-sm font-light tracking-wide">{property.location}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-heading font-light tracking-tight mb-3 group-hover:text-accent transition-colors duration-300">
                    {property.name}
                  </h3>
                  <div className="flex items-center gap-6 text-sm font-light text-text/60 dark:text-white/60">
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
                </div>
                
                <div className="text-left md:text-right pt-4 md:pt-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 mb-1 font-semibold">Starting From</p>
                  <p className="text-3xl font-heading font-bold text-text dark:text-white tracking-tight">
                    {property.price > 0 ? formatCurrency(property.price, property.currency) : 'Contact Us'}
                  </p>
                  {property.investment_ready &&
                    property.investment_details?.projected_rental_yield && (
                      <p className="text-sm text-accent font-semibold mt-2">
                        {property.investment_details.projected_rental_yield}% Proj. Yield
                      </p>
                    )}
                </div>
              </div>

              <p className="text-text/70 dark:text-white/70 mb-8 line-clamp-3 font-light leading-relaxed max-w-3xl">
                {property.description || 'Experience premium real estate with unparalleled amenities and strategic location.'}
              </p>
            </div>

            <div className="flex justify-start">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent group-hover:text-accent-dark transition-colors duration-300">
                View Details
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
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
      transition={{ delay: index * 0.05, duration: 0.8, ease: "easeOut" }}
    >
      <Link href={`/properties/${property.id}`} className="property-card h-full flex flex-col group transition-all duration-500">
        <div className="relative h-72 overflow-hidden bg-black/5">
          <img
            src={property.images[0] || fallbackImg}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {property.investment_ready && (
              <span className="investment-badge shadow-lg">
                <TrendingUp className="w-3.5 h-3.5" />
                Investment
              </span>
            )}
            <span
              className={`px-3 py-1.5 text-white text-[10px] uppercase tracking-[0.2em] font-semibold rounded-xl backdrop-blur-md shadow-lg ${
                property.status === 'available'
                  ? 'bg-secondary/90'
                  : property.status === 'sold'
                  ? 'bg-black/80'
                  : 'bg-accent/90'
              }`}
            >
              {property.status === 'available' ? 'AVAILABLE' : 'SOLD OUT'}
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

        <div className="p-8 flex-grow flex flex-col">
          <h3 className="text-xl font-heading font-semibold mb-3 line-clamp-1 tracking-tight group-hover:text-accent transition-colors duration-300">
            {property.name}
          </h3>
          <p className="text-text/60 dark:text-white/60 text-sm mb-6 line-clamp-2 font-light leading-relaxed flex-grow">
            {property.description || 'Experience premium real estate with unparalleled amenities and strategic location.'}
          </p>

          <div className="flex items-center gap-6 mb-8 text-sm font-light text-text/70 dark:text-white/70 pb-6">
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

          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 mb-1 font-semibold">Starting From</p>
              <p className="text-2xl font-heading font-bold text-text dark:text-white tracking-tight">
                {property.price > 0 ? formatCurrency(property.price, property.currency) : 'Contact Us'}
              </p>
            </div>
            {property.investment_ready &&
              property.investment_details?.projected_rental_yield && (
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 mb-1 font-semibold">Proj. Yield</p>
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
