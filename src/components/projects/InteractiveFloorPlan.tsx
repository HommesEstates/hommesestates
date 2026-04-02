'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight, Fingerprint, Wifi, Wind, Shield, ChevronRight, Building, Layers, Box, Sun, Moon, Check, MapPin, CheckCircle, Clock, Phone } from 'lucide-react'
import { publicApi } from '@/lib/backend'
import { odooAPI } from '@/lib/api'

// --- Types ---
type Status = 'available' | 'reserved' | 'sold'
interface Unit {
  id: string
  suiteId?: number
  number: string
  floor: string | number
  area: number // sqm
  price: number
  status: Status
  bedrooms?: number
  bathrooms?: number
  type: string
  block?: string
  features?: string[]
  layout?: 'standard' | 'corner'
  // Dynamic layout attributes from backend
  gridColStart?: number
  gridColSpan?: number
  gridRowStart?: number
  gridRowSpan?: number
  rotation?: number
  zIndex?: number
  customCss?: string
}

interface FloorPlanProps {
  projectId: string
  projectName: string
  totalFloors?: number
  unitsPerFloor?: number
  propertyId?: number
  units?: Partial<Unit>[]
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

export function InteractiveFloorPlan({
  projectId,
  projectName,
  totalFloors,
  unitsPerFloor = 8,
  propertyId,
  units: externalUnits
}: FloorPlanProps) {
  const [allUnits, setAllUnits] = useState<Unit[] | null>(null)

  const [selectedBlock, setSelectedBlock] = useState<string>('all')
  const [selectedFloor, setSelectedFloor] = useState<string>('all')
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [filter, setFilter] = useState<Status | 'all'>('available')
  
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerResult, setOfferResult] = useState<{ ok: boolean; order_id?: number; portal_url?: string; confirmation_url?: string; error?: string } | null>(null)
  const [offerForm, setOfferForm] = useState<{ name: string; email: string; phone: string; street?: string; city?: string; state?: string; country?: string; country_id?: number; state_id?: number; payment_term_id?: string }>({ name: '', email: '', phone: '' })
  
  const [paymentTerms, setPaymentTerms] = useState<Array<{ id: number; name: string }>>([])
  
  // Ref for click-outside detection
  const panelRef = useRef<HTMLDivElement>(null)
  
  // Click outside handler - close form/panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Close the panel when clicking outside
        if (selectedUnit) {
          setSelectedUnit(null)
          setShowOfferForm(false)
          setOfferResult(null)
        }
      }
    }
    
    // Only add listener when panel is open
    if (selectedUnit) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedUnit])
  
  // Load suites
  useEffect(() => {
    let cancelled = false
    async function loadSuites() {
      if (!propertyId) {
        if (!externalUnits) setAllUnits([])
        return
      }
      try {
        const suites = await publicApi.listPropertySuites(propertyId)
        if (cancelled) return
        const mapped: Unit[] = (suites || []).map((s: any, idx: number) => {
          let floorNum: string | number = 1
          if (typeof s?.level === 'number' && !Number.isNaN(s.level)) {
            floorNum = s.level
          } else if (typeof s?.floor === 'string') {
            floorNum = s.floor
          }
          return {
            id: String(s.id ?? idx),
            suiteId: typeof s.id === 'number' ? s.id : (Number(s.id) || undefined),
            number: String(s.suite_number ?? s.number ?? s.name ?? s.id ?? idx),
            floor: floorNum,
            area: Number(s.size_sqm ?? s.area ?? 0) || 0,
            price: Number(s.price ?? s.price_total ?? s.list_price ?? 0) || 0,
            status: (String(s.status || (s.is_available ? 'available' : 'sold')).toLowerCase() as Status),
            bedrooms: s.bedrooms ?? undefined,
            bathrooms: s.bathrooms ?? undefined,
            type: String(s.type || s.category || 'SUITE').toUpperCase(),
            block: s.block ? String(s.block) : (s.tower ? String(s.tower) : (s.building ? String(s.building) : undefined)),
            features: [
              s.features?.includes('smart') ? 'Smart Infrastructure' : 'Premium Fixtures',
              'AI-driven climate monitoring',
              'High-speed internet ready'
            ],
            layout: (idx === 0 || idx === 3) ? 'corner' : 'standard',
            // Map backend layout positioning fields
            gridColStart: s.layout_col_start ?? s.col_start ?? s.grid_col_start,
            gridColSpan: s.layout_col_span ?? s.col_span ?? s.grid_col_span,
            gridRowStart: s.layout_row_start ?? s.row_start ?? s.grid_row_start,
            gridRowSpan: s.layout_row_span ?? s.row_span ?? s.grid_row_span,
            rotation: s.layout_rotation ?? s.rotation ?? 0,
            zIndex: s.layout_z_index ?? s.z_index ?? 10,
            customCss: s.layout_custom_css ?? s.custom_css ?? '',
          }
        })
        setAllUnits(mapped)
      } catch (e) {
        setAllUnits([])
      }
    }
    loadSuites()
    return () => { cancelled = true }
  }, [propertyId, externalUnits])

  // Load payment terms
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

  const blocks = useMemo(() => {
    if (allUnits && allUnits.length) {
      const set = new Set<string>()
      allUnits.forEach(u => { if (u.block) set.add(u.block) })
      return Array.from(set).sort()
    }
    return []
  }, [allUnits])

  useEffect(() => {
    if (blocks.length > 0 && selectedBlock === 'all') {
      setSelectedBlock(blocks[0])
    }
  }, [blocks, selectedBlock])

  const floors = useMemo(() => {
    if (allUnits && allUnits.length) {
      const pool = allUnits.filter(u => selectedBlock === 'all' ? true : u.block === selectedBlock)
      const set = new Set<string>()
      pool.forEach(u => { if (u.floor) set.add(String(u.floor)) })
      
      // Smart floor ordering: Ground, First, Second, Third, etc.
      const floorOrder = ['ground', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 
                          'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
                          '11', '12', '13', '14', '15', 'penthouse', 'ph']
      
      return Array.from(set).sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        const aIdx = floorOrder.findIndex(f => aLower.includes(f))
        const bIdx = floorOrder.findIndex(f => bLower.includes(f))
        // If both found in order, use that
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
        // If only one found, prioritize it
        if (aIdx !== -1) return -1
        if (bIdx !== -1) return 1
        // Fallback to alphabetical
        return a.localeCompare(b)
      })
    }
    return []
  }, [allUnits, selectedBlock])

  useEffect(() => {
    if (floors.length > 0 && (!selectedFloor || selectedFloor === 'all' || !floors.includes(selectedFloor))) {
      setSelectedFloor(floors[0])
    }
  }, [floors, selectedFloor])

  const currentFloorSuites = useMemo(() => {
    if (!allUnits) return []
    return allUnits.filter(s => 
      (selectedBlock === 'all' || s.block === selectedBlock) && 
      (selectedFloor === 'all' || String(s.floor) === selectedFloor) &&
      (filter === 'all' || s.status === filter)
    )
  }, [allUnits, selectedBlock, selectedFloor, filter])

  const handleRequestOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUnit) return
    setOfferSubmitting(true)
    setOfferResult(null)
    try {
      const numericSuiteId = (typeof selectedUnit.suiteId === 'number' && selectedUnit.suiteId > 0)
        ? selectedUnit.suiteId : (Number(selectedUnit.id) > 0 ? Number(selectedUnit.id) : undefined)

      if (!numericSuiteId) throw new Error('Missing suite_id for offer request')

      let auth: any = null
      try { auth = JSON.parse(localStorage.getItem('odoo_auth') || 'null') } catch {}

      if (auth && auth.uid) {
        const res = await odooAPI.createOfferDirect({
          suite_id: numericSuiteId,
          payment_term_id: offerForm.payment_term_id ? Number(offerForm.payment_term_id) : undefined,
        })
        if (res && res.ok) setOfferResult({ ok: true })
        else setOfferResult({ ok: false, error: 'Failed to create offer' })
      } else {
        const res = await odooAPI.createOfferPublic({
          suite_id: numericSuiteId,
          name: offerForm.name,
          email: offerForm.email,
          phone: offerForm.phone,
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

  const liveSuiteDataUnavailable = !!propertyId && allUnits !== null && allUnits.length === 0

  if (liveSuiteDataUnavailable) {
    return (
      <div className="bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-2xl overflow-hidden border border-border">
        <div className="p-8 md:p-10">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent font-semibold mb-4">Live Availability</p>
            <h3 className="text-3xl font-heading font-light tracking-tight mb-4">Interactive suite data is temporarily unavailable.</h3>
            <p className="text-text/65 dark:text-white/65 font-light leading-relaxed mb-8">
              We can display the property overview right now, but the live suite inventory for {projectName} is not being returned by the upstream property system at the moment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden bg-gray-50 dark:bg-[#030712] rounded-xl font-sans text-gray-900 dark:text-white transition-colors duration-500 min-h-[800px] border border-gray-200 dark:border-white/10 shadow-2xl">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none rounded-xl overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2560&auto=format&fit=crop" 
          alt="City Skyline" 
          className="w-full h-full object-cover opacity-10 dark:opacity-60 dark:mix-blend-luminosity transition-opacity duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/90 via-gray-50/60 to-gray-50/95 dark:from-[#030712]/90 dark:via-[#030712]/60 dark:to-[#030712]/95 backdrop-blur-[4px] transition-colors duration-500" />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col md:flex-row h-full w-full p-6 gap-6 min-h-[800px]">
        
        {/* Left Nav: Glass Panel */}
        <nav className="w-full md:w-80 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden shadow-2xl shrink-0 transition-colors duration-500">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-gray-200 dark:border-white/5 transition-colors duration-500">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 dark:border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <Building className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="font-heading text-2xl font-medium tracking-wide text-gray-900 dark:text-white mb-1 transition-colors duration-500 uppercase">{projectName}</h1>
            <p className="text-xs tracking-[0.2em] uppercase text-gray-500 dark:text-white/40 font-medium transition-colors duration-500">Property Explorer</p>
          </div>

          {/* Block & Floor Selection */}
          <div className="flex-1 p-6 overflow-y-auto no-scrollbar flex flex-col gap-8">
            
            {/* Block Selection */}
            {blocks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Box className="w-4 h-4 text-gray-400 dark:text-white/40 transition-colors duration-500" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold transition-colors duration-500">Select Block</span>
                </div>
                <div className="flex flex-col gap-2 bg-gray-100 dark:bg-black/20 p-1.5 rounded-2xl border border-gray-200 dark:border-white/5 transition-colors duration-500">
                  {blocks.map((block) => {
                    const isSelected = selectedBlock === block;
                    return (
                      <button
                        key={block}
                        onClick={() => { setSelectedBlock(block); setSelectedUnit(null); setShowOfferForm(false); }}
                        className={`relative w-full py-3 px-4 rounded-xl text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                          isSelected 
                            ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 dark:border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                            : 'text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 hover:bg-white dark:hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {block}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Floor Selection */}
            {floors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Layers className="w-4 h-4 text-gray-400 dark:text-white/40 transition-colors duration-500" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold transition-colors duration-500">Select Floor</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  {floors.map((floor) => {
                    const isSelected = selectedFloor === floor;
                    return (
                      <button
                        key={floor}
                        onClick={() => { setSelectedFloor(floor); setSelectedUnit(null); setShowOfferForm(false); }}
                        className={`relative w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-500 overflow-hidden group ${
                          isSelected ? 'bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'bg-transparent border border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {isSelected && (
                          <motion.div 
                            layoutId="active-floor"
                            className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"
                          />
                        )}
                        <span className={`relative z-10 font-[Cormorant_Garamond] text-xl transition-colors ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-white/40 group-hover:text-gray-900 dark:group-hover:text-white/80'}`}>
                          {floor}
                        </span>
                        {isSelected && <ChevronRight className="w-5 h-5 text-orange-500 dark:text-orange-400 relative z-10" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Status Filter */}
            <div>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Box className="w-4 h-4 text-gray-400 dark:text-white/40 transition-colors duration-500" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold transition-colors duration-500">Filter Status</span>
              </div>
              <div className="flex flex-col gap-2 bg-gray-100 dark:bg-black/20 p-1.5 rounded-2xl border border-gray-200 dark:border-white/5 transition-colors duration-500">
                {(['all', 'available', 'reserved', 'sold'] as const).map((statusOption) => {
                  const isSelected = filter === statusOption;
                  return (
                    <button
                      key={statusOption}
                      onClick={() => setFilter(statusOption as any)}
                      className={`relative w-full py-3 px-4 rounded-xl text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                        isSelected 
                          ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/30 dark:border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]' 
                          : 'text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/80 hover:bg-white dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {statusOption}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-8 border-t border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-black/20 transition-colors duration-500">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)] dark:shadow-[0_0_10px_rgba(251,146,60,0.6)]" />
                <span className="text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/60 font-medium">Available</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-white/20 border border-gray-400 dark:border-white/30" />
                <span className="text-[10px] uppercase tracking-widest text-gray-600 dark:text-white/60 font-medium">Reserved</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-white/5" />
                <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-white/40 font-medium">Sold</span>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Center Floor Plan: Glass Panel */}
        <main className="flex-1 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 flex flex-col relative overflow-hidden shadow-2xl transition-colors duration-500">
          
          {/* Header Area */}
          <div className="absolute top-10 left-10 z-20">
            <motion.div 
              key={`${selectedBlock}-${selectedFloor}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center gap-6"
            >
              <h2 className="font-[Cormorant_Garamond] text-5xl font-light text-gray-900 dark:text-white tracking-tight transition-colors duration-500">{selectedFloor !== 'all' ? selectedFloor : 'All Floors'}</h2>
              <div className="flex flex-col justify-center gap-1">
                <span className="text-sm uppercase tracking-[0.3em] text-orange-600 dark:text-orange-400 font-medium transition-colors duration-500">{selectedBlock !== 'all' ? selectedBlock : ''}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/40 font-medium transition-colors duration-500">Floor Plan</span>
              </div>
            </motion.div>
          </div>

          {/* Dynamic Grid Container */}
          <div className="flex-1 flex items-center justify-center p-6 sm:p-12 mt-24">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${selectedBlock}-${selectedFloor}`}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-5xl overflow-auto p-4"
              >
                {/* Dynamic Grid Container with CSS Grid from backend layout */}
                {currentFloorSuites.length > 0 ? (
                    <div 
                        className={`w-full grid gap-4 bg-gray-200/50 dark:bg-white/5 p-4 rounded-3xl border border-gray-300 dark:border-white/10 relative shadow-inner overflow-hidden`}
                        style={{
                            gridTemplateColumns: `repeat(${Math.min(5, Math.max(3, Math.ceil(Math.sqrt(currentFloorSuites.length))))}, minmax(160px, 1fr))`,
                            gridAutoRows: 'minmax(160px, auto)',
                            maxWidth: '100%'
                        }}
                    >
                    {currentFloorSuites.map((suite) => {
                        // Use backend layout position if available, otherwise auto-position
                        const hasLayout = suite.gridColStart && suite.gridColStart > 0;
                        
                        return (
                        <div 
                         key={suite.id} 
                         style={{
                            gridColumnStart: hasLayout ? suite.gridColStart : 'auto',
                            gridColumnEnd: hasLayout && suite.gridColSpan ? `span ${suite.gridColSpan}` : 'auto',
                            gridRowStart: hasLayout ? suite.gridRowStart : 'auto',
                            gridRowEnd: hasLayout && suite.gridRowSpan ? `span ${suite.gridRowSpan}` : 'auto',
                            transform: suite.rotation ? `rotate(${suite.rotation}deg)` : undefined,
                            zIndex: suite.zIndex,
                            ...(suite.customCss ? JSON.parse(suite.customCss) : {})
                         }}
                        >
                        <SuiteCell suite={suite} isSelected={selectedUnit?.id === suite.id} onClick={() => { setSelectedUnit(suite); setShowOfferForm(false); }} />
                        </div>
                        );
                    })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400 dark:text-white/30 text-sm uppercase tracking-widest text-center">
                        No suites found for this selection.
                    </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Right Details: Glass Panel */}
        <AnimatePresence>
          {selectedUnit && (
            <motion.aside
              ref={panelRef}
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: 420, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="rounded-3xl bg-white/95 dark:bg-[#030712]/95 backdrop-blur-3xl border border-gray-200 dark:border-white/20 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] absolute right-6 top-6 bottom-6 z-50 transition-colors duration-500"
            >
              <div className="w-[420px] flex flex-col h-full bg-white dark:bg-transparent">
                {/* Image Header */}
                <div className="h-72 relative shrink-0 p-6 flex flex-col justify-between">
                  <img 
                    src={selectedUnit.layout === 'corner' 
                      ? "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop"
                      : "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000&auto=format&fit=crop"
                    }
                    alt="Suite Interior"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 dark:opacity-60 mix-blend-overlay"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 dark:from-[#030712] dark:via-[#030712]/40 to-transparent transition-colors duration-500" />
                  
                  <div className="relative z-10 flex justify-end">
                    <button 
                      onClick={() => { setSelectedUnit(null); setShowOfferForm(false); }}
                      className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/20 transition-all shadow-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 mb-4 shadow-sm transition-colors duration-500">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedUnit.status === 'available' ? 'bg-orange-500 dark:bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)] dark:shadow-[0_0_10px_rgba(251,146,60,0.8)]' : 
                        selectedUnit.status === 'reserved' ? 'bg-gray-400 dark:bg-white/40' : 'bg-gray-300 dark:bg-white/10'
                      }`} />
                      <span className="text-[10px] uppercase tracking-widest text-gray-800 dark:text-white/90 font-medium">{selectedUnit.status}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-orange-600 dark:text-orange-300 font-semibold mb-1 transition-colors duration-500">{selectedUnit.type}</p>
                    <h2 className="font-[Cormorant_Garamond] text-4xl font-medium text-gray-900 dark:text-white tracking-tight transition-colors duration-500">Suite {selectedUnit.number}</h2>
                  </div>
                </div>

                {/* Content or Form */}
                <div className="flex-1 overflow-y-auto no-scrollbar relative">
                  <AnimatePresence mode="wait">
                    {!showOfferForm ? (
                      <motion.div 
                        key="details"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-8"
                      >
                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-10">
                          <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 transition-colors duration-500">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-medium mb-2 transition-colors duration-500">Total Area</p>
                            <p className="text-2xl font-bold font-heading text-gray-900 dark:text-white transition-colors duration-500">{selectedUnit.area} <span className="text-xs font-sans text-gray-500 dark:text-white/40">SQM</span></p>
                          </div>
                          <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 transition-colors duration-500">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-medium mb-2 transition-colors duration-500">Investment</p>
                            <p className="text-xl font-bold font-heading text-gray-900 dark:text-white transition-colors duration-500">
                              {selectedUnit.status === 'sold' ? 'Withheld' : formatCurrency(selectedUnit.price)}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        {(selectedUnit.features && selectedUnit.features.length > 0) && (
                            <div>
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold mb-6 transition-colors duration-500">Smart Infrastructure</h3>
                                <div className="grid grid-cols-1 gap-4">
                                {selectedUnit.features.map((feat, i) => {
                                    const icons = [<Fingerprint className="w-4 h-4" />, <Wind className="w-4 h-4" />, <Wifi className="w-4 h-4" />, <Shield className="w-4 h-4" />];
                                    return (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 transition-colors duration-500">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 transition-colors duration-500">
                                        {icons[i % icons.length]}
                                        </div>
                                        <span className="text-sm font-light text-gray-700 dark:text-white/80 transition-colors duration-500">{feat}</span>
                                    </div>
                                    );
                                })}
                                </div>
                            </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-8 h-full flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-white">Request Offer</h3>
                          <button 
                            onClick={() => !offerSubmitting && setShowOfferForm(false)}
                            className="text-xs uppercase tracking-wider text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        
                        {offerResult ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center">
                            {offerResult.ok ? (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
                                    <Check className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-xl font-heading font-medium text-gray-900 dark:text-white mb-2">Offer Requested</h4>
                                    <p className="text-sm text-gray-500 dark:text-white/60 mb-6">Our executive team will contact you shortly regarding Suite {selectedUnit.number}.</p>
                                    <div className="flex flex-col gap-3 w-full">
                                        {offerResult.confirmation_url && (
                                            <a href={offerResult.confirmation_url} target="_blank" className="w-full bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-400 text-white py-4 text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] text-center">Open Portal</a>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-xl font-heading font-medium text-red-500 mb-2">Error</h4>
                                    <p className="text-sm text-gray-500 dark:text-white/60 mb-6">{offerResult.error}</p>
                                    <button onClick={() => setOfferResult(null)} className="px-5 py-3 border border-border rounded-lg text-sm uppercase tracking-wider">Try Again</button>
                                </>
                            )}
                          </div>
                        ) : (
                          <form onSubmit={handleRequestOffer} className="flex-1 flex flex-col gap-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold mb-2">Full Name</label>
                              <input required type="text" value={offerForm.name} onChange={(e) => setOfferForm({...offerForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors" placeholder="John Doe" />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold mb-2">Email</label>
                              <input required type="email" value={offerForm.email} onChange={(e) => setOfferForm({...offerForm, email: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors" placeholder="john@acme.com" />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold mb-2">Phone</label>
                              <input required type="tel" value={offerForm.phone} onChange={(e) => setOfferForm({...offerForm, phone: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors" placeholder="+1 (555) 000-0000" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/40 font-semibold mb-2">Payment Plan (optional)</label>
                                <select value={offerForm.payment_term_id || ''} onChange={(e) => setOfferForm({ ...offerForm, payment_term_id: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 transition-colors">
                                <option value="" className="text-gray-900">Select plan</option>
                                {paymentTerms.map(t => (
                                    <option key={t.id} value={String(t.id)} className="text-gray-900">{t.name}</option>
                                ))}
                                </select>
                            </div>
                            <div className="mt-auto pt-4">
                              <button disabled={offerSubmitting} type="submit" className="w-full disabled:opacity-50 bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-400 text-white py-4 text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                                {offerSubmitting ? 'Submitting...' : 'Submit Request'}
                              </button>
                            </div>
                          </form>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer CTA */}
                {(!showOfferForm && selectedUnit.status === 'available') && (
                  <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-100/80 dark:bg-black/40 backdrop-blur-xl transition-colors duration-500">
                    <button 
                      onClick={() => setShowOfferForm(true)}
                      className="w-full bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-400 text-white py-4 text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 flex items-center justify-center gap-3 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    >
                      Request Offer <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {(!showOfferForm && selectedUnit.status !== 'available') && (
                  <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-100/80 dark:bg-black/40 backdrop-blur-xl transition-colors duration-500">
                    <div className="w-full bg-gray-300 dark:bg-white/5 text-gray-500 dark:text-white/40 py-4 text-[11px] uppercase tracking-[0.2em] font-semibold flex items-center justify-center rounded-xl cursor-not-allowed">
                       Unit {selectedUnit.status}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function SuiteCell({ suite, isSelected, onClick }: { suite: Unit; isSelected: boolean; onClick: () => void }) {
    const isAvailable = suite.status === 'available';
    const isReserved = suite.status === 'reserved';
    
    let bg = 'bg-gray-200 dark:bg-black/40';
    let text = 'text-gray-900 dark:text-white';
    let border = 'border-gray-300 dark:border-white/5';
  
    if (isSelected) {
      bg = 'bg-orange-500/10 dark:bg-orange-500/20';
      text = 'text-gray-900 dark:text-white';
      border = 'border-orange-500 dark:border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] dark:shadow-[0_0_30px_rgba(249,115,22,0.3)]';
    } else if (isReserved) {
      bg = 'bg-gray-100 dark:bg-white/5';
      text = 'text-gray-400 dark:text-white/50';
      border = 'border-gray-200 dark:border-white/10';
    } else if (!isAvailable) {
      bg = 'bg-transparent';
      text = 'text-gray-300 dark:text-white/20';
      border = 'border-gray-200 dark:border-white/5';
    } else {
      bg = 'bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10';
      border = 'border-gray-200 dark:border-white/20 hover:border-orange-400/50 dark:hover:border-orange-400/50';
    }
  
    return (
      <div 
        onClick={onClick}
        className={`${bg} ${text} ${border} border w-full h-[180px] p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all duration-500 group relative overflow-hidden backdrop-blur-md ${isAvailable ? 'hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:z-20' : ''} ${isSelected ? 'scale-[1.02] shadow-2xl dark:shadow-[0_0_40px_rgba(249,115,22,0.2)] z-20' : 'z-10'}`}
      >
        <div className="flex justify-between items-start relative z-10">
          <span className="font-[Cormorant_Garamond] text-3xl font-light tracking-tight">{suite.number}</span>
          {isAvailable && !isSelected && <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)] dark:shadow-[0_0_10px_rgba(251,146,60,0.8)] opacity-50 group-hover:opacity-100 transition-opacity" />}
        </div>
        
        <div className="relative z-10">
          <p className={`text-[9px] font-medium tracking-wider mb-1 uppercase ${isSelected ? 'text-orange-600 dark:text-orange-300' : isAvailable ? 'text-gray-600 dark:text-white/80' : 'text-gray-400 dark:text-white/40'}`}>
            {suite.status}
          </p>
          <p className={`text-[8px] uppercase tracking-widest ${isSelected ? 'text-gray-700 dark:text-white/80' : 'text-gray-400 dark:text-white/30'}`}>
            {suite.area} SQM
          </p>
        </div>
  
        {isAvailable && !isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/5 dark:to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}
      </div>
    );
  }
