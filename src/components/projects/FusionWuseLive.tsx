'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProjectStats } from '@/components/projects/ProjectStats'
import { InteractiveFloorPlan } from '@/components/projects/InteractiveFloorPlan'
import { PropertyViewer3D } from '@/components/projects/PropertyViewer3D'
import { publicApi } from '@/lib/backend'

export function FusionWuseLive({ propertyId: propId, propertyName = 'Fusion Wuse' }: { propertyId?: number; propertyName?: string }) {
  const [propertyId, setPropertyId] = useState<number | null>(propId ?? null)
  const [detail, setDetail] = useState<any | null>(null)
  const [suites, setSuites] = useState<any[]>([])
  const [renders, setRenders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        setLoading(true)
        let id = propId ?? null
        if (!id) {
          // Find by name
          const list = await publicApi.listProperties()
          const match = (list || []).find((p: any) => (p?.name || '').toLowerCase().includes(propertyName.toLowerCase()))
          if (match?.id) id = Number(match.id)
        }
        if (!id) { setLoading(false); return }
        if (cancelled) return
        setPropertyId(id)
        const [det, st] = await Promise.all([
          publicApi.getProperty(id),
          publicApi.listPropertySuites(id),
        ])
        if (cancelled) return
        setDetail(det)
        setSuites(Array.isArray(st) ? st : [])
        setRenders([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [propId, propertyName])

  const stats = useMemo(() => {
    const floors = new Set<number>()
    suites.forEach((s) => { const f = Number(s.floor || s.level || 0); if (f) floors.add(f) })
    const totalUnits = suites.length
    const floorsCount = floors.size || (detail?.floors || detail?.floors_count || 0)
    const startingPrice = typeof detail?.price_from === 'number' ? detail.price_from : 0
    const yieldPct = detail?.investment_details?.projected_rental_yield
      ?? detail?.expected_yield
      ?? detail?.roi_percentage
      ?? 12
    return [
      { label: 'Total Units', value: totalUnits },
      { label: 'Floors', value: floorsCount },
      { label: 'Starting Price', value: Math.round(startingPrice), prefix: '₦' },
      { label: 'Expected Yield', value: Math.round(yieldPct), suffix: '%' },
    ]
  }, [detail, suites])

  const galleryImages: string[] = useMemo(() => {
    const imgs = Array.isArray(detail?.images) ? detail.images.map((i: any) => i.url).filter(Boolean) : []
    if (imgs.length) return imgs
    const main = detail?.main_image_url ? [detail.main_image_url] : []
    const rimgs = (renders || []).map((r: any) => r.url || r.image_url).filter(Boolean)
    return [...main, ...rimgs]
  }, [detail, renders])

  const modelUrl = detail?.model_url || detail?.model3d_url || detail?.virtual_tour_model_url
  const tourUrl = detail?.virtual_tour_url || detail?.tour_url || detail?.matterport_url

  return (
    <>
      <ProjectStats stats={stats as any} />

      <section className="section-container bg-bg dark:bg-[#030712] transition-colors duration-500">
        <div className="text-center mb-12">
          <h2 className="text-h2 font-heading font-bold mb-4 text-text dark:text-white transition-colors duration-500">Interactive Floor Plan</h2>
          <p className="text-lg text-text/70 dark:text-white/70 max-w-2xl mx-auto transition-colors duration-500">
            Explore available suites by floor. Click a unit to view pricing and availability in real time.
          </p>
        </div>
        {propertyId && (
          <InteractiveFloorPlan
            projectId={String(propertyId)}
            projectName={detail?.name || propertyName}
            propertyId={propertyId}
          />
        )}
      </section>

      <section className="section-container bg-surface dark:bg-[#0a0a0a] transition-colors duration-500">
        <div className="text-center mb-12">
          <h2 className="text-h2 font-heading font-bold mb-4 text-text dark:text-white transition-colors duration-500">Virtual Tour & 3D View</h2>
          <p className="text-lg text-text/70 dark:text-white/70 max-w-2xl mx-auto transition-colors duration-500">Experience the property in 3D or explore the photo gallery.</p>
        </div>
        <PropertyViewer3D
          propertyName={detail?.name || propertyName}
          propertyId={String(propertyId || '')}
          modelUrl={modelUrl}
          tourUrl={tourUrl}
          images={galleryImages}
          enableVirtualStaging={true}
        />
      </section>
    </>
  )
}
