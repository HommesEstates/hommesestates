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

export default function PropertyDetailPage() {
  const params = useParams() as { id?: string }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [data, setData] = useState<any | null>(null)
  const [suites, setSuites] = useState<any[]>([])
  const [renders, setRenders] = useState<any[]>([])
  const [cmsGallery, setCmsGallery] = useState<string[]>([])

  useEffect(() => {
    const id = Number(params?.id || 0)
    if (!id) return
    let cancelled = false
    async function run() {
      setLoading(true)
      setError("")
      try {
        const [detail, st] = await Promise.all([
          publicApi.getProperty(id),
          publicApi.listPropertySuites(id),
        ])
        if (cancelled) return
        if (detail) setData(detail)
        else setError("Failed to load property")
        setSuites(Array.isArray(st) ? st : [])
        setRenders([])
        setCmsGallery([])
      } finally {
        if (!cancelled) setLoading(false)
      }
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

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="text-text dark:text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4">
              <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Properties', href: '/properties' }, { label: data?.name || 'Property' }]} />
            </div>
            {/* Hero Image */}
            {images.length > 0 && (
              <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-8 border">
                <img src={images[0].url} alt={data?.name || 'Property image'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              </div>
            )}
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="space-y-10">
                {/* Title + Meta */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold">{data?.name}</h1>
                    <p className="text-text/70 dark:text-white/70">
                      {[data?.city, data?.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text/60 dark:text-white/60">Starting from</p>
                    <p className="text-3xl font-heading font-bold">{typeof data?.price_from === 'number' ? `₦${Math.round(data.price_from).toLocaleString()}` : '—'}</p>
                  </div>
                </div>

                {/* Metrics Row */}
                <ProjectStats
                  stats={[
                    { label: 'Total Units', value: metrics.total || 0 },
                    { label: 'Floors', value: metrics.floors || 0 },
                    { label: 'Starting Price', value: Math.round(metrics.priceFrom || 0), prefix: '₦' },
                    { label: 'Expected Yield', value: Math.round(metrics.yieldPct || 0), suffix: '%' },
                  ]}
                />

                {/* Interactive Floor Plan - Full Width */}
                <section className="section-container">
                  <div className="text-center mb-12">
                    <h2 className="text-h2 font-heading font-bold mb-4">Interactive Floor Plan</h2>
                    <p className="text-lg text-text/70 max-w-2xl mx-auto">
                      Explore available suites by floor. Click a unit to view pricing and availability in real time.
                    </p>
                  </div>
                  <InteractiveFloorPlan
                    projectId={String(params?.id || '')}
                    projectName={data?.name || 'Property'}
                    propertyId={Number(params?.id || 0)}
                  />
                </section>

                {/* Virtual Tour & 3D View - Full Width */}
                <section className="section-container bg-surface">
                  <div className="text-center mb-12">
                    <h2 className="text-h2 font-heading font-bold mb-4">Virtual Tour & 3D View</h2>
                    <p className="text-lg text-text/70 max-w-2xl mx-auto">Experience the property in 3D or explore the photo gallery.</p>
                  </div>
                  <PropertyViewer3D
                    propertyName={data?.name || 'Property'}
                    propertyId={String(params?.id || '')}
                    modelUrl={data?.model_url || data?.model3d_url || data?.virtual_tour_model_url}
                    tourUrl={data?.virtual_tour_url || data?.tour_url || data?.matterport_url}
                    images={galleryImages}
                    enableVirtualStaging={true}
                  />
                </section>

                {/* Gallery */}
                {galleryImages.length > 0 && (
                  <section className="section-container bg-surface">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {galleryImages.map((src, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden border">
                          <img src={src} alt={(data?.name || 'Property') + ' image'} className="w-full h-64 object-cover" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Plans */}
                {Array.isArray(data?.plans) && data.plans.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-heading font-semibold mb-4">Plans & Renders</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.plans.map((pl: any) => (
                        <div key={pl.id} className="border rounded-lg overflow-hidden">
                          {pl.image_url ? (
                            <img src={pl.image_url} alt={pl.name} className="w-full h-48 object-cover" />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-sm text-text/60 dark:text-white/60">
                              {pl.type?.toUpperCase() || 'PLAN'}
                            </div>
                          )}
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{pl.name}</p>
                              <p className="text-xs text-text/60 dark:text-white/60">{pl.type || ''}{pl.is_interactive ? ' • Interactive' : ''}</p>
                            </div>
                            <div className="flex gap-2">
                              {pl.plan_url && (
                                <a className="px-3 py-2 border rounded" href={pl.plan_url} target="_blank">Open</a>
                              )}
                              {pl.file_url && (
                                <a className="px-3 py-2 border rounded" href={pl.file_url} target="_blank">Download</a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Suites */}
                {Array.isArray(data?.suites) && data.suites.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-heading font-semibold mb-4">Available Suites</h2>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-neutral-50 dark:bg-neutral-800">
                            <th className="text-left p-3">Suite</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3">Size</th>
                            <th className="text-left p-3">Floor</th>
                            <th className="text-left p-3">Block</th>
                            <th className="text-left p-3">Price</th>
                            <th className="text-left p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.suites.map((s: any) => (
                            <tr key={s.id} className="border-t">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  {s.image_url ? (
                                    <img src={s.image_url} alt={s.name} className="w-16 h-12 object-cover rounded" />
                                  ) : <div className="w-16 h-12 bg-neutral-200 rounded" />}
                                  <div>
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-xs text-text/60 dark:text-white/60">#{s.suite_number || ''}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">{s.type || '—'}</td>
                              <td className="p-3">{s.size_sqm ? `${s.size_sqm} sqm` : '—'}</td>
                              <td className="p-3">{s.floor || '—'}</td>
                              <td className="p-3">{s.block || '—'}</td>
                              <td className="p-3">{typeof s.price === 'number' ? `₦${Math.round(s.price).toLocaleString()}` : '—'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs ${s.is_available ? 'bg-secondary text-white' : 'bg-neutral-300 text-neutral-700'}`}>
                                  {s.is_available ? 'Available' : 'Unavailable'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Investment & Amenities */}
                <section className="section-container">
                  <InvestmentROI projectId={String(params?.id || '')} />
                </section>
                <section className="section-container">
                  <ProjectAmenities />
                </section>

                {/* Back to list */}
                <div>
                  <Link href="/properties" className="px-4 py-2 border rounded">Back to Properties</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
