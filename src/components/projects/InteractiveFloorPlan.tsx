'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, DollarSign, Ruler, MapPin, CheckCircle, Clock, Phone } from 'lucide-react'
import { publicApi } from '@/lib/backend'
import { odooAPI } from '@/lib/api'

interface Unit {
  id: string
  suiteId?: number
  number: string
  floor: number
  area: number // sqm
  price: number
  status: 'available' | 'reserved' | 'sold'
  bedrooms?: number
  bathrooms?: number
  type: 'studio' | 'office' | '1bed' | '2bed' | '3bed'
  block?: string
  coordinates: { x: number; y: number; width: number; height: number } // SVG coordinates
}

interface FloorPlanProps {
  projectId: string
  projectName: string
  totalFloors?: number
  unitsPerFloor?: number
  propertyId?: number
  units?: Partial<Unit>[]
}

export function InteractiveFloorPlan({ 
  projectId, 
  projectName, 
  totalFloors,
  unitsPerFloor = 8,
  propertyId,
  units: externalUnits
}: FloorPlanProps) {
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all')
  const [blockFilter, setBlockFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [heatmap, setHeatmap] = useState<'none' | 'availability' | 'price'>('none')
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null)
  const [allUnits, setAllUnits] = useState<Unit[] | null>(null)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerResult, setOfferResult] = useState<{ ok: boolean; order_id?: number; portal_url?: string; confirmation_url?: string; error?: string } | null>(null)
  const [offerForm, setOfferForm] = useState<{ name: string; email: string; phone: string; street?: string; city?: string; state?: string; country?: string; country_id?: number; state_id?: number; payment_term_id?: string }>({ name: '', email: '', phone: '' })
  const [paymentTerms, setPaymentTerms] = useState<Array<{ id: number; name: string }>>([])
  const [countries, setCountries] = useState<Array<{ id: number; name: string; code?: string }>>([])
  const [statesList, setStatesList] = useState<Array<{ id: number; name: string; code?: string; country_id: number }>>([])
  const svgRef = useRef<SVGSVGElement>(null)

  // Load suites from backend if propertyId provided
  useEffect(() => {
    let cancelled = false
    async function loadSuites() {
      if (!propertyId) return
      try {
        const suites = await publicApi.listPropertySuites(propertyId)
        if (cancelled) return
        const mapped: Unit[] = (suites || []).map((s: any, idx: number) => {
          // Robust floor parsing: use numeric level, else parse digits from name, else default 1
          let floorNum = 1
          if (typeof s?.level === 'number' && !Number.isNaN(s.level)) {
            floorNum = Number(s.level)
          } else if (typeof s?.floor === 'string') {
            const lower = s.floor.toLowerCase()
            if (/(ground|g)/.test(lower)) floorNum = 1
            else {
              const m = lower.match(/-?\d+/)
              floorNum = m ? Number(m[0]) || 1 : 1
            }
          }
          return {
            id: String(s.id ?? idx),
            suiteId: typeof s.id === 'number' ? s.id : (Number(s.id) || undefined),
            number: String(s.suite_number ?? s.name ?? s.number ?? s.id ?? idx),
            floor: floorNum,
            area: Number(s.size_sqm ?? s.area ?? 0) || 0,
            price: Number(s.price ?? s.price_total ?? s.list_price ?? 0) || 0,
            status: (String(s.status || (s.is_available ? 'available' : 'sold')) as any).toLowerCase() as Unit['status'],
            bedrooms: s.bedrooms ?? undefined,
            bathrooms: s.bathrooms ?? undefined,
            type: (String(s.type || s.category || 'office').toLowerCase() as any),
            block: s.block ? String(s.block) : (s.tower ? String(s.tower) : (s.building ? String(s.building) : undefined)),
            coordinates: { x: 0, y: 0, width: 0, height: 0 },
          }
        })
        setAllUnits(mapped)
        // Overlay image not implemented in backend yet
      } catch (e) {
        // keep fallback
        setAllUnits([])
      }
    }
    loadSuites()
    return () => { cancelled = true }
  }, [propertyId])

  // Load active payment terms for selector
  useEffect(() => {
    let cancelled = false
    async function loadTerms() {
      try {
        const terms = await odooAPI.paymentTerms()
        if (!cancelled) setPaymentTerms(Array.isArray(terms) ? terms : [])
      } catch {}
    }
    loadTerms()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadCountries() {
      try {
        const rows = await odooAPI.countries()
        if (!cancelled) setCountries(Array.isArray(rows) ? rows : [])
      } catch {}
    }
    loadCountries()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadStates() {
      const cid = offerForm.country_id
      if (!cid) { setStatesList([]); return }
      try {
        const rows = await odooAPI.states(cid)
        if (!cancelled) setStatesList(Array.isArray(rows) ? rows : [])
      } catch { setStatesList([]) }
    }
    loadStates()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerForm.country_id])

  // Compute floors and units per floor
  const floors = useMemo(() => {
    if (allUnits && allUnits.length) {
      const pool = allUnits.filter(u => blockFilter === 'all' ? true : (u.block ? u.block.toLowerCase() === blockFilter : false))
      const set = new Set(pool.map(u => u.floor || 1))
      return Array.from(set).sort((a, b) => a - b)
    }
    return Array.from({ length: totalFloors || 1 }, (_, i) => i + 1)
  }, [allUnits, totalFloors, blockFilter])

  // Base units for selected floor
  const baseUnits: Unit[] = useMemo(() => {
    // Priority: externalUnits -> Odoo suites -> generated
    if (externalUnits && externalUnits.length) {
      return (externalUnits as Unit[])
        .map((u, idx) => ({
          id: String(u.id ?? idx),
          number: String(u.number ?? u.id ?? idx),
          floor: Number((u as any).floor ?? 1) || 1,
          area: Number(u.area ?? 0) || 0,
          price: Number((u as any).price ?? 0) || 0,
          status: (u.status || 'available'),
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          type: (u.type || 'office') as any,
          coordinates: { x: 0, y: 0, width: 0, height: 0 },
        }))
        .filter(u => u.floor === selectedFloor)
    }
    if (allUnits && allUnits.length) {
      return allUnits.filter(u => (u.floor === selectedFloor) && (blockFilter === 'all' ? true : (u.block ? u.block.toLowerCase() === blockFilter : false)))
    }
    return generateFloorUnits(selectedFloor, unitsPerFloor)
  }, [externalUnits, allUnits, selectedFloor, unitsPerFloor, blockFilter])

  // Assign coordinates in a neat grid for visualization
  const units: Unit[] = useMemo(() => {
    const count = baseUnits.length
    const perSide = Math.max(1, Math.ceil(count / 2))
    const unitWidth = 180
    const unitHeight = 200
    const spacing = 10
    return baseUnits.map((u, i) => {
      const isTopRow = i < perSide
      const positionInRow = i % perSide
      return {
        ...u,
        coordinates: {
          x: 70 + (positionInRow * (unitWidth + spacing)),
          y: isTopRow ? 70 : 350,
          width: unitWidth,
          height: unitHeight,
        },
      }
    })
  }, [baseUnits])

  const filteredUnits = units.filter(unit => 
    (filter === 'all' ? true : unit.status === filter)
    && (blockFilter === 'all' ? true : (unit.block ? unit.block.toLowerCase() === blockFilter : false))
    && (typeFilter === 'all' ? true : (unit.type ? unit.type.toLowerCase() === typeFilter : false))
  )

  const blocks = useMemo(() => {
    if (allUnits && allUnits.length) {
      const set = new Set<string>()
      allUnits.forEach(u => { if (u.block) set.add(String(u.block).toLowerCase()) })
      return Array.from(set).sort()
    }
    return []
  }, [allUnits])

  const types = useMemo(() => {
    if (allUnits && allUnits.length) {
      const set = new Set<string>()
      allUnits.forEach(u => { if (u.type) set.add(String(u.type).toLowerCase()) })
      return Array.from(set).sort()
    }
    return []
  }, [allUnits])

  const priceStats = useMemo(() => {
    const arr = (allUnits || []).map(u => Number(u.price || 0)).filter(n => n > 0)
    if (!arr.length) return { min: 0, max: 0 }
    return { min: Math.min(...arr), max: Math.max(...arr) }
  }, [allUnits])

  const statusColors = {
    available: { bg: '#10B981', border: '#059669', text: 'Available' },
    reserved: { bg: '#F59E0B', border: '#D97706', text: 'Reserved' },
    sold: { bg: '#6B7280', border: '#4B5563', text: 'Sold' }
  }

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit)
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'unit_view', {
        project_id: projectId,
        unit_id: unit.id,
        floor: unit.floor,
        status: unit.status
      })
    }
  }

  const handleRequestOffer = (unit: Unit) => {
    setOfferForm({ name: '', email: '', phone: '' })
    setOfferResult(null)
    setShowOfferModal(true)
  }

  const submitOffer = async () => {
    if (!selectedUnit) return
    setOfferSubmitting(true)
    setOfferResult(null)
    try {
      const numericSuiteId = (typeof selectedUnit.suiteId === 'number' && selectedUnit.suiteId > 0)
        ? selectedUnit.suiteId
        : (Number(selectedUnit.id) > 0 ? Number(selectedUnit.id) : undefined)

      if (!numericSuiteId) {
        throw new Error('Missing suite_id for offer request')
      }

      // Check if user is authenticated with Odoo
      let auth: any = null
      try { auth = JSON.parse(localStorage.getItem('odoo_auth') || 'null') } catch {}

      if (auth && auth.uid) {
        // Create direct offer for logged-in user
        const res = await odooAPI.createOfferDirect({
          suite_id: numericSuiteId,
          payment_term_id: offerForm.payment_term_id ? Number(offerForm.payment_term_id) : undefined,
        })
        if (res && res.ok) {
          setOfferResult({ ok: true })
        } else {
          setOfferResult({ ok: false, error: 'Failed to create offer' })
        }
      } else {
        // Create public offer with expiration
        const res = await odooAPI.createOfferPublic({
          suite_id: numericSuiteId,
          name: offerForm.name,
          email: offerForm.email,
          phone: offerForm.phone,
          street: offerForm.street,
          city: offerForm.city,
          state: offerForm.state,
          country: offerForm.country,
          country_id: offerForm.country_id,
          state_id: offerForm.state_id,
          payment_term_id: offerForm.payment_term_id ? Number(offerForm.payment_term_id) : undefined,
          expires_in_days: 7,
        })
        if (res && res.ok) setOfferResult({ ok: true, portal_url: res.portal_url, confirmation_url: res.portal_url })
        else setOfferResult({ ok: false, error: 'Failed to submit offer' })
      }
    } catch (e: any) {
      setOfferResult({ ok: false, error: e?.message || 'Network error' })
    } finally {
      setOfferSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl overflow-hidden">
      {/* Header Controls */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Blocks First */}
          <div>
            <label className="block text-sm font-medium text-text/70 mb-2">
              Select Block
            </label>
            <div className="flex gap-2 flex-wrap">
              {blocks.length === 0 ? (
                <span className="text-sm text-text/60">No blocks</span>
              ) : (
                <>
                  <button
                    onClick={() => { setBlockFilter('all'); setSelectedFloor(floors[0] || 1) }}
                    className={`px-4 py-2 rounded-lg font-accent font-semibold transition-all ${blockFilter === 'all' ? 'bg-copper-gradient text-white shadow-lg' : 'bg-muted text-text/70 hover:bg-accent/10'}`}
                  >
                    All
                  </button>
                  {blocks.map(b => (
                    <button
                      key={b}
                      onClick={() => { setBlockFilter(b); setSelectedFloor((floors[0] || 1)) }}
                      className={`px-4 py-2 rounded-lg font-accent font-semibold transition-all ${blockFilter === b ? 'bg-copper-gradient text-white shadow-lg' : 'bg-muted text-text/70 hover:bg-accent/10'}`}
                    >
                      {b.toUpperCase()}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Floor Selector */}
          <div>
            <label className="block text-sm font-medium text-text/70 mb-2">
              Select Floor
            </label>
            <div className="flex gap-2 flex-wrap">
              {floors.map(floor => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`
                    px-4 py-2 rounded-lg font-accent font-semibold transition-all
                    ${selectedFloor === floor 
                      ? 'bg-copper-gradient text-white shadow-lg' 
                      : 'bg-muted text-text/70 hover:bg-accent/10'
                    }
                  `}
                >
                  {floor}F
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-text/70 mb-2">
              Filter by Status
            </label>
            <div className="flex gap-2">
              {(['all', 'available', 'reserved', 'sold'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                    ${filter === status 
                      ? 'bg-accent text-white' 
                      : 'bg-muted text-text/70 hover:bg-accent/10'
                    }
                  `}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Type & Heatmap */}
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-text/70 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-muted rounded-lg"
              >
                <option value="all">All</option>
                {types.map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text/70 mb-2">Heatmap</label>
              <div className="flex gap-2">
                {(['none', 'availability', 'price'] as const).map(h => (
                  <button
                    key={h}
                    onClick={() => setHeatmap(h)}
                    className={`px-3 py-2 rounded-lg text-sm ${heatmap === h ? 'bg-accent text-white' : 'bg-muted text-text/70'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-4 flex-wrap">
          {Object.entries(statusColors).map(([status, { bg, text }]) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: bg }}
              />
              <span className="text-sm text-text/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG Floor Plan */}
      <div className="p-6 bg-muted/30">
        <div className="relative bg-white dark:bg-charcoal rounded-xl p-4 overflow-auto">
          <svg
            ref={svgRef}
            viewBox="0 0 1000 600"
            className="w-full h-auto"
            style={{ minHeight: '400px' }}
          >
            {/* Plan Overlay Image */}
            {overlayUrl && (
              <image href={overlayUrl} x="50" y="50" width="900" height="500" opacity="0.5" />
            )}
            {/* Building Outline */}
            <rect
              x="50"
              y="50"
              width="900"
              height="500"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="2"
            />

            {/* Corridor */}
            <rect
              x="50"
              y="275"
              width="900"
              height="50"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="1"
            />
            <text
              x="500"
              y="305"
              textAnchor="middle"
              className="text-xs fill-text/50"
            >
              CORRIDOR
            </text>

            {/* Units */}
            {filteredUnits.map(unit => {
              const isHovered = hoveredUnit === unit.id
              const isSelected = selectedUnit?.id === unit.id
              const statusColor = statusColors[unit.status]
              // Heatmap color logic
              let fillColor = '#FFFFFF'
              let fillOpacity = (isHovered || isSelected) ? 0.3 : 0.1
              if (heatmap === 'availability') {
                fillColor = statusColor.bg
                fillOpacity = 0.25
              } else if (heatmap === 'price') {
                const min = priceStats.min
                const max = priceStats.max
                const v = Number(unit.price || 0)
                let ratio = 0
                if (max > min && v > 0) ratio = (v - min) / (max - min)
                fillColor = '#CC5500'
                fillOpacity = 0.15 + ratio * 0.35
              }

              return (
                <g key={unit.id}>
                  {/* Unit Rectangle */}
                  <rect
                    x={unit.coordinates.x}
                    y={unit.coordinates.y}
                    width={unit.coordinates.width}
                    height={unit.coordinates.height}
                    fill={fillColor}
                    fillOpacity={fillOpacity}
                    stroke={statusColor.border}
                    strokeWidth={isHovered || isSelected ? 3 : 2}
                    className="cursor-pointer transition-all"
                    onClick={() => handleUnitClick(unit)}
                    onMouseEnter={() => setHoveredUnit(unit.id)}
                    onMouseLeave={() => setHoveredUnit(null)}
                  />

                  {/* Unit Number */}
                  <text
                    x={unit.coordinates.x + unit.coordinates.width / 2}
                    y={unit.coordinates.y + unit.coordinates.height / 2 - 10}
                    textAnchor="middle"
                    className="text-sm font-bold fill-text pointer-events-none"
                  >
                    {unit.number}
                  </text>

                  {/* Unit Area */}
                  <text
                    x={unit.coordinates.x + unit.coordinates.width / 2}
                    y={unit.coordinates.y + unit.coordinates.height / 2 + 10}
                    textAnchor="middle"
                    className="text-xs fill-text/60 pointer-events-none"
                  >
                    {unit.area}m²
                  </text>

                  {/* Status Indicator */}
                  <circle
                    cx={unit.coordinates.x + 10}
                    cy={unit.coordinates.y + 10}
                    r="5"
                    fill={statusColor.bg}
                    className="pointer-events-none"
                  />
                </g>
              )
            })}

            {/* Compass */}
            <g transform="translate(900, 80)">
              <circle cx="0" cy="0" r="30" fill="white" stroke="#CC5500" strokeWidth="2" />
              <text x="0" y="-15" textAnchor="middle" className="text-xs font-bold fill-accent">N</text>
              <polygon points="0,-20 -5,-5 5,-5" fill="#CC5500" />
            </g>
          </svg>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard
            label="Total Units"
            value={(allUnits && allUnits.length) || units.length}
            icon={<MapPin />}
          />
          <StatCard
            label="Available"
            value={(allUnits || units).filter(u => u.status === 'available').length}
            icon={<CheckCircle />}
            color="text-green-600"
          />
          <StatCard
            label="Reserved"
            value={(allUnits || units).filter(u => u.status === 'reserved').length}
            icon={<Clock />}
            color="text-orange-600"
          />
          <StatCard
            label="Sold"
            value={(allUnits || units).filter(u => u.status === 'sold').length}
            icon={<X />}
            color="text-gray-600"
          />
        </div>
      </div>

      {/* Unit Detail Modal */}
      <AnimatePresence>
        {selectedUnit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUnit(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-copper-gradient p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-heading font-bold mb-2">
                      Unit {selectedUnit.number}
                    </h3>
                    <p className="text-white/90">
                      Floor {selectedUnit.floor} • {selectedUnit.type.toUpperCase()} {selectedUnit.block ? `• Block ${(selectedUnit.block as any).toString().toUpperCase()}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUnit(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span
                    className="px-4 py-2 rounded-full text-white font-semibold text-sm"
                    style={{ backgroundColor: statusColors[selectedUnit.status].bg }}
                  >
                    {statusColors[selectedUnit.status].text}
                  </span>
                  {selectedUnit.status === 'available' && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Ready for Immediate Occupancy
                    </span>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <DetailItem
                    icon={<DollarSign />}
                    label="Price"
                    value={`₦${(selectedUnit.price / 1000000).toFixed(1)}M`}
                  />
                  <DetailItem
                    icon={<Ruler />}
                    label="Area"
                    value={`${selectedUnit.area} m²`}
                  />
                  {selectedUnit.bedrooms && (
                    <DetailItem
                      icon={<MapPin />}
                      label="Bedrooms"
                      value={selectedUnit.bedrooms.toString()}
                    />
                  )}
                  {selectedUnit.bathrooms && (
                    <DetailItem
                      icon={<MapPin />}
                      label="Bathrooms"
                      value={selectedUnit.bathrooms.toString()}
                    />
                  )}
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-heading font-semibold mb-3">Features & Amenities</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {[
                      'Central Air Conditioning',
                      'High-Speed Internet Ready',
                      'Premium Fixtures',
                      'Smart Access Control',
                      '24/7 Security',
                      'Backup Power',
                      'Ample Parking',
                      'Elevator Access'
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-text/70">
                        <CheckCircle className="w-4 h-4 text-accent" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Info (if available) */}
                {selectedUnit.status === 'available' && (
                  <div className="p-4 bg-accent/10 rounded-xl border-l-4 border-accent">
                    <h4 className="font-heading font-semibold mb-2">Investment Potential</h4>
                    <p className="text-sm text-text/70 mb-2">
                      Estimated rental yield: <strong className="text-accent">12-14% p.a.</strong>
                    </p>
                    <p className="text-sm text-text/70">
                      Projected appreciation: <strong className="text-accent">8-10% annually</strong>
                    </p>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedUnit.status === 'available' && (
                    <>
                      <button
                        onClick={() => handleRequestOffer(selectedUnit)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-copper-gradient text-white rounded-xl font-accent font-semibold hover:shadow-xl transition-all"
                      >
                        <Phone className="w-5 h-5" />
                        Request Offer
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-accent text-accent rounded-xl font-accent font-semibold hover:bg-accent hover:text-white transition-all">
                        <Maximize2 className="w-5 h-5" />
                        Schedule Viewing
                      </button>
                    </>
                  )}
                  {selectedUnit.status === 'reserved' && (
                    <button className="w-full px-6 py-4 bg-muted text-text/70 rounded-xl font-accent font-semibold cursor-not-allowed">
                      This unit is currently reserved
                    </button>
                  )}
                  {selectedUnit.status === 'sold' && (
                    <button className="w-full px-6 py-4 bg-muted text-text/70 rounded-xl font-accent font-semibold cursor-not-allowed">
                      This unit has been sold
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offer Request Modal */}
      <AnimatePresence>
        {showOfferModal && selectedUnit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !offerSubmitting && setShowOfferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="sticky top-0 bg-copper-gradient p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-heading font-bold mb-2">Request Offer</h3>
                    <p className="text-white/90">Unit {selectedUnit.number} • Floor {selectedUnit.floor}{selectedUnit.block ? ` • Block ${(selectedUnit.block as any).toString().toUpperCase()}` : ''}</p>
                  </div>
                  <button onClick={() => !offerSubmitting && setShowOfferModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {!offerResult ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-text/60 mb-1">Full Name</label>
                        <input value={offerForm.name} onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })} className="w-full px-4 py-3 bg-muted rounded-lg" placeholder="Jane Doe" />
                      </div>
                      <div>
                        <label className="block text-sm text-text/60 mb-1">Email</label>
                        <input value={offerForm.email} onChange={(e) => setOfferForm({ ...offerForm, email: e.target.value })} className="w-full px-4 py-3 bg-muted rounded-lg" placeholder="jane@example.com" />
                      </div>
                      <div>
                        <label className="block text-sm text-text/60 mb-1">Phone</label>
                        <input value={offerForm.phone} onChange={(e) => setOfferForm({ ...offerForm, phone: e.target.value })} className="w-full px-4 py-3 bg-muted rounded-lg" placeholder="+234..." />
                      </div>
                      <div>
                        <label className="block text-sm text-text/60 mb-1">Payment Plan (optional)</label>
                        <select value={offerForm.payment_term_id || ''} onChange={(e) => setOfferForm({ ...offerForm, payment_term_id: e.target.value })} className="w-full px-4 py-3 bg-muted rounded-lg">
                          <option value="">Select plan</option>
                          {paymentTerms.map(t => (
                            <option key={t.id} value={String(t.id)}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-text/60 mb-1">Street</label>
                        <input value={offerForm.street || ''} onChange={(e) => setOfferForm({ ...offerForm, street: e.target.value })} className="w-full px-4 py-3 bg-muted rounded-lg" placeholder="123 Luxury Ave" />
                      </div>
                      <div>
                        <label className="block text-sm text-text/60 mb-1">City</label>
                        <input value={offerForm.city || ''} onChange={(e) => setOfferForm({ ...offerForm, city: e.target.value })} className="w-full px-4 py-3 bg-muted rounded-lg" placeholder="Abuja" />
                      </div>
                      <div>
                        <label className="block text-sm text-text/60 mb-1">Country</label>
                        <select
                          value={offerForm.country_id || ''}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : undefined
                            setOfferForm({ ...offerForm, country_id: v, state_id: undefined })
                          }}
                          className="w-full px-4 py-3 bg-muted rounded-lg"
                        >
                          <option value="">Select country</option>
                          {countries.map(c => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-text/60 mb-1">State/Region</label>
                        {statesList.length > 0 ? (
                          <select
                            value={offerForm.state_id || ''}
                            onChange={(e) => setOfferForm({ ...offerForm, state_id: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full px-4 py-3 bg-muted rounded-lg"
                          >
                            <option value="">Select state</option>
                            {statesList.map(s => (
                              <option key={s.id} value={String(s.id)}>{s.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input value={offerForm.state || ''} onChange={(e) => setOfferForm({ ...offerForm, state: e.target.value })} className="w-full px-4 py-3 bg-muted rounded-lg" placeholder="FCT" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => setShowOfferModal(false)} className="px-5 py-3 rounded-lg border">Cancel</button>
                      <button onClick={submitOffer} disabled={offerSubmitting || !offerForm.name || !offerForm.email} className={`px-5 py-3 rounded-lg ${offerSubmitting ? 'bg-accent/60' : 'bg-accent'} text-white`}>
                        {offerSubmitting ? 'Requesting…' : 'Submit Request'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {offerResult.ok ? (
                      <div className="space-y-4">
                        <p className="text-green-600 dark:text-green-400 font-medium">Your offer request has been created.</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          {offerResult.confirmation_url && (
                            <a
                              href={`${(() => { const u = offerResult.confirmation_url || ''; return /^https?:\/\//i.test(u) ? u : `/api/odoo${u}` })()}`}
                              target="_blank"
                              className="flex-1 px-5 py-3 bg-accent text-white rounded-lg text-center"
                            >
                              Open Offer in Portal
                            </a>
                          )}
                          <a
                            href={`/login?redirect=${encodeURIComponent((() => { const u = offerResult.portal_url || offerResult.confirmation_url || '/my'; return /^https?:\/\//i.test(u) ? u : `/api/odoo${u}` })())}`}
                            className="flex-1 px-5 py-3 border rounded-lg text-center"
                          >
                            Create Account / Sign In
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-red-600 dark:text-red-400 font-medium">{offerResult.error || 'Offer request failed.'}</p>
                        <div className="flex justify-end">
                          <button onClick={() => setOfferResult(null)} className="px-5 py-3 rounded-lg border">Back</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper Components
function StatCard({ label, value, icon, color = 'text-accent' }: any) {
  return (
    <div className="bg-white dark:bg-charcoal rounded-xl p-4 shadow-sm">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-heading font-bold">{value}</p>
      <p className="text-sm text-text/60">{label}</p>
    </div>
  )
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <div className="text-accent">{icon}</div>
      <div>
        <p className="text-xs text-text/60">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  )
}

// Production Helper: Generate units based on floor
// In production, this would be replaced with API call
function generateFloorUnits(floor: number, count: number): Unit[] {
  const units: Unit[] = []
  const unitsPerSide = Math.ceil(count / 2)
  
  for (let i = 0; i < count; i++) {
    const isTopRow = i < unitsPerSide
    const positionInRow = i % unitsPerSide
    const unitWidth = 180
    const unitHeight = 200
    const spacing = 10
    
    units.push({
      id: `unit-${floor}-${i + 1}`,
      number: `${floor}${String(i + 1).padStart(2, '0')}`,
      floor,
      area: 45 + Math.floor(Math.random() * 30), // 45-75 sqm
      price: 35000000 + Math.floor(Math.random() * 15000000), // ₦35M-50M
      status: ['available', 'reserved', 'sold'][Math.floor(Math.random() * 3)] as any,
      type: ['office', 'studio', '1bed'][Math.floor(Math.random() * 3)] as any,
      bedrooms: Math.random() > 0.5 ? 1 : undefined,
      bathrooms: 1,
      coordinates: {
        x: 70 + (positionInRow * (unitWidth + spacing)),
        y: isTopRow ? 70 : 350,
        width: unitWidth,
        height: unitHeight
      }
    })
  }
  
  return units
}
