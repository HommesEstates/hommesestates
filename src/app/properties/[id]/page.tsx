"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { publicApi } from "@/lib/backend"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Breadcrumbs } from "@/components/common/Breadcrumbs"
import { InteractiveFloorPlan } from "@/components/projects/InteractiveFloorPlan"
import { PropertyViewer3D } from "@/components/projects/PropertyViewer3D"
import { ProjectStats } from "@/components/projects/ProjectStats"
import { InvestmentROI } from "@/components/projects/InvestmentROI"
import { ProjectAmenities } from "@/components/projects/ProjectAmenities"
import { motion } from "framer-motion"
import { ArrowLeft, MapPin } from "lucide-react"

export default function PropertyDetailPage() {
  const params = useParams() as { id?: string }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [data, setData] = useState<any | null>(null)
  const [suites, setSuites] = useState<any[]>([])

  useEffect(() => {
    const id = Number(params?.id || 0)
    if (!id) return
    let cancelled = false
    async function run() {
      setLoading(true)
      setError("")
      const [detailResult, suitesResult] = await Promise.allSettled([
        publicApi.getProperty(id),
        publicApi.listPropertySuites(id),
      ])
      if (cancelled) return

      const detail = detailResult.status === 'fulfilled' ? detailResult.value : null
      const st = suitesResult.status === 'fulfilled' ? suitesResult.value : []

      if (detail) {
        setData(detail)
        setSuites(Array.isArray(st) ? st : [])
      } else {
        setError("Failed to load property")
        setSuites([])
      }

      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [params?.id])

  const images: { id?: number; url: string }[] = Array.isArray(data?.images)
    ? data.images
    : (data?.main_image_url ? [{ url: data.main_image_url }] : [])

  const galleryImages: string[] = useMemo(() => {
    const fallback = [
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop',
    ]
    return fallback
  }, [])

  const metrics = useMemo(() => {
    const sarr: any[] = Array.isArray(data?.suites) ? data.suites : suites
    const total = sarr.length
    const availableUnits = sarr.filter((s: any) => s?.is_available !== false)
    const available = availableUnits.length
    const floorsSet = new Set<number>()
    sarr.forEach((s: any) => { const f = Number(s.floor || s.level || 0); if (!Number.isNaN(f) && f > 0) floorsSet.add(f) })
    const floors = floorsSet.size || 0
    let priceFrom = typeof data?.price_from === 'number' ? data.price_from : 0
    if ((!priceFrom || priceFrom <= 0) && availableUnits.length) {
      const prices = availableUnits.map((s: any) => Number(s.price || 0)).filter((n: number) => n > 0)
      if (prices.length) priceFrom = Math.min(...prices)
    }
    const yieldPct = data?.investment_details?.projected_rental_yield
      ?? data?.expected_yield
      ?? data?.roi_percentage
      ?? 12
    return { total, available, floors, priceFrom, yieldPct }
  }, [data, suites])

  const suitesForDisplay = useMemo(() => {
    if (Array.isArray(data?.suites) && data.suites.length > 0) return data.suites
    return Array.isArray(suites) ? suites : []
  }, [data, suites])

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 bg-surface">
        <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="mb-8">
            <Link 
              href="/properties"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-text/60 hover:text-accent transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Properties
            </Link>
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Properties', href: '/properties' }, { label: data?.name || 'Property Detail' }]} />
          </div>

          {loading ? (
            <div className="animate-pulse space-y-8">
              <div className="h-[60vh] bg-white/5 rounded-2xl"></div>
              <div className="h-32 bg-white/5 rounded-2xl"></div>
              <div className="h-96 bg-white/5 rounded-2xl"></div>
            </div>
          ) : error ? (
            <div className="text-center py-32 bg-white/5 rounded-2xl">
              <p className="text-xl text-red-500 font-light mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="text-accent hover:text-accent-dark text-sm font-semibold uppercase tracking-[0.15em]">Try Again</button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-16"
            >
              {/* Hero Section */}
              <div className="relative h-[60vh] min-h-[500px] rounded-2xl overflow-hidden group">
                <img 
                  src={images[0]?.url || galleryImages[0]} 
                  alt={data?.name || 'Property'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-2000" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-2 text-white/90 mb-4">
                        <MapPin className="w-4 h-4 text-accent" />
                        <span className="text-sm font-light tracking-wide uppercase">
                          {[data?.city, data?.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mb-4">
                        {data?.name}
                      </h1>
                      <p className="text-white/80 text-lg font-light leading-relaxed line-clamp-2 max-w-2xl">
                        {data?.description}
                      </p>
                    </div>
                    
                    <div className="text-left md:text-right bg-black/40 backdrop-blur-md p-6 rounded-xl">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-semibold">Starting Price</p>
                      <p className="text-4xl font-heading font-bold text-white tracking-tight">
                        {metrics.priceFrom > 0 ? `₦${Math.round(metrics.priceFrom).toLocaleString()}` : 'Contact Us'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="bg-white/5 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-2">
                <ProjectStats
                  stats={[
                    { label: 'Total Units', value: metrics.total || 0 },
                    { label: 'Available', value: metrics.available || 0 },
                    { label: 'Floors', value: metrics.floors || 0 },
                    { label: 'Projected Yield', value: Math.round(metrics.yieldPct || 0), suffix: '%' },
                  ]}
                />
              </div>

              {/* Description */}
              {data?.description && (
                <div className="grid md:grid-cols-3 gap-12 pt-8">
                  <div className="md:col-span-1">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-text/50 dark:text-white/50 mb-4">About the Property</h2>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-lg text-text/80 dark:text-white/80 font-light leading-relaxed">
                      {data.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Virtual Tour & 3D View */}
              <div className="pt-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-heading font-light mb-4 tracking-tight">Virtual Tour & 3D View</h2>
                  <p className="text-text/60 dark:text-white/60 font-light">Experience the property in immersive 3D.</p>
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <PropertyViewer3D
                    propertyName={data?.name || 'Property'}
                    propertyId={String(params?.id || '')}
                    modelUrl={data?.model_url || data?.model3d_url || data?.virtual_tour_model_url}
                    tourUrl={data?.virtual_tour_url || data?.tour_url || data?.matterport_url}
                    images={galleryImages}
                    enableVirtualStaging={true}
                  />
                </div>
              </div>

              {/* Interactive Floor Plan */}
              <div className="pt-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-heading font-light mb-4 tracking-tight">Interactive Floor Plan</h2>
                  <p className="text-text/60 dark:text-white/60 font-light">
                    Explore available suites by floor. Click a unit to view pricing.
                  </p>
                </div>
                <InteractiveFloorPlan
                  projectId={String(params?.id || '')}
                  projectName={data?.name || 'Property'}
                  propertyId={Number(params?.id || 0)}
                />
              </div>

              {/* Amenities & Investment */}
              <div className="grid lg:grid-cols-2 gap-12 pt-8">
                <div>
                  <h2 className="text-2xl font-heading font-light mb-8 tracking-tight">Premium Amenities</h2>
                  <ProjectAmenities />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-light mb-8 tracking-tight">Investment Analysis</h2>
                  <InvestmentROI projectId={String(params?.id || '')} />
                </div>
              </div>

            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
