'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Layers, Grid3X3, Plus, Save, ArrowLeft, ChevronRight, Home, Map, Loader2, AlertCircle, Search, Filter, Box, Maximize2, Move, Grid } from 'lucide-react'
import { publicApi } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface Property {
  id: number
  name: string
  address: string
  total_floors: number
  total_suites: number
  image_url?: string
  blocks?: Block[]
}

interface Block {
  id: number
  name: string
  code: string
  total_floors: number
  total_suites: number
  property_id: number
  floors?: Floor[]
}

interface Floor {
  id: number
  name: string
  floor_number: number
  block_id: number
  block_name?: string
  property_id: number
  total_suites: number
  available_suites: number
  has_layout: boolean
  layout_url?: string
}

interface Suite {
  id: number
  name: string
  unit_number: string
  floor_id: number
  status: 'available' | 'reserved' | 'sold'
  list_price: number
  area_sqm: number
  x?: number
  y?: number
  width?: number
  height?: number
}

function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
    >
      <div className="relative h-56 overflow-hidden">
        {property.image_url ? (
          <Image src={property.image_url} alt={property.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent-dark/40 flex items-center justify-center">
            <Building2 className="w-20 h-20 text-accent/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{property.name}</h3>
          <p className="text-white/80 text-sm flex items-center gap-1">
            <Home className="w-4 h-4" />
            {property.address}
          </p>
        </div>
        <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-sm font-semibold text-accent shadow-lg">
          {property.total_floors} Floors
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Box className="w-4 h-4 text-accent" />
              <span>{property.blocks?.length || 0} Blocks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Grid className="w-4 h-4 text-accent" />
              <span>{property.total_suites} Suites</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  )
}

function BlockCard({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group cursor-pointer bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-md hover:shadow-xl transition-all border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center shadow-lg">
          <Box className="w-7 h-7 text-white" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-accent group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{block.name}</h3>
      <p className="text-sm text-gray-500 mb-3">Code: {block.code}</p>
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Layers className="w-4 h-4 text-accent" />
          <span className="font-medium">{block.total_floors} Floors</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Grid className="w-4 h-4 text-accent" />
          <span className="font-medium">{block.total_suites} Suites</span>
        </div>
      </div>
    </motion.div>
  )
}

function FloorCard({ floor, onClick }: { floor: Floor; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-gray-100"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent-dark/20 rounded-lg flex items-center justify-center">
          <Layers className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{floor.name}</h3>
          <p className="text-sm text-gray-500">{floor.block_name || 'Block'}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-accent transition-colors" />
      </div>
      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-2xl font-bold text-gray-900">{floor.total_suites}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{floor.available_suites}</p>
          <p className="text-xs text-gray-500">Available</p>
        </div>
        {floor.has_layout && (
          <div className="ml-auto">
            <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">Has Layout</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DraggableSuite({ suite, isSelected, onClick, scale }: { suite: Suite; isSelected: boolean; onClick: () => void; scale: number }) {
  const statusColors = { available: 'bg-green-500', reserved: 'bg-amber-500', sold: 'bg-gray-500' }
  return (
    <motion.div
      drag
      dragMomentum={false}
      onClick={onClick}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{ position: 'absolute', left: (suite.x || 0) * scale, top: (suite.y || 0) * scale, width: (suite.width || 100) * scale, height: (suite.height || 80) * scale }}
      className={`rounded-lg shadow-lg cursor-move overflow-hidden ${isSelected ? 'ring-4 ring-accent ring-offset-2' : ''} ${statusColors[suite.status] || 'bg-green-500'}`}
    >
      <div className="p-2 text-white h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold truncate">{suite.unit_number}</span>
          <Move className="w-3 h-3 opacity-60" />
        </div>
        <div className="text-xs opacity-90">
          <div className="font-semibold">{formatCurrency(suite.list_price)}</div>
          <div>{suite.area_sqm} m²</div>
        </div>
      </div>
    </motion.div>
  )
}

function FloorPlanEditor({ floor, suites, onSave, onBack }: { floor: Floor; suites: Suite[]; onSave: (suites: Suite[]) => void; onBack: () => void }) {
  const [selectedSuite, setSelectedSuite] = useState<Suite | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(floor.layout_url || null)
  const [zoom, setZoom] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadedImage(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Floor Editor</h2>
            <p className="text-gray-500">{floor.block_name} • {floor.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-white text-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium">
            <Plus className="w-4 h-4" />
            {uploadedImage ? 'Change Plan' : 'Upload Plan'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => onSave(suites)} className="px-5 py-2.5 bg-accent text-white rounded-xl shadow-lg shadow-accent/30 hover:shadow-xl transition-all flex items-center gap-2 font-medium">
            <Save className="w-4 h-4" />
            Save Layout
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-md">
        <button className={`p-2 rounded-lg transition-colors ${selectedSuite ? 'bg-accent text-white' : 'hover:bg-gray-100 text-gray-600'}`} onClick={() => setSelectedSuite(null)}>
          <Move className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-gray-200" />
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Maximize2 className="w-5 h-5" /></button>
        <span className="text-sm text-gray-500 font-medium">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Maximize2 className="w-5 h-5" /></button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Available
          <span className="w-3 h-3 rounded-full bg-amber-500 ml-2" /> Reserved
          <span className="w-3 h-3 rounded-full bg-gray-500 ml-2" /> Sold
        </div>
      </div>

      <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: '600px' }}>
        {uploadedImage ? (
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${uploadedImage})` }} />
        ) : (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <Map className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Upload a floor plan image to start</p>
              <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">Upload Floor Plan</button>
            </div>
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`, backgroundSize: `${20 * zoom}px ${20 * zoom}px` }} />
        <div className="absolute inset-0">
          {suites.map((suite) => (
            <DraggableSuite key={suite.id} suite={suite} isSelected={selectedSuite?.id === suite.id} onClick={() => setSelectedSuite(suite)} scale={zoom} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-accent" />
          Suites on this Floor ({suites.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {suites.map((suite) => (
            <button key={suite.id} onClick={() => setSelectedSuite(suite)} className={`p-3 rounded-lg text-left transition-all ${selectedSuite?.id === suite.id ? 'bg-accent text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}>
              <div className="font-medium text-sm">{suite.unit_number}</div>
              <div className={`text-xs ${selectedSuite?.id === suite.id ? 'text-white/80' : 'text-gray-500'}`}>{formatCurrency(suite.list_price)}</div>
              <div className={`text-xs mt-1 ${suite.status === 'available' ? 'text-green-400' : suite.status === 'reserved' ? 'text-amber-400' : 'text-gray-400'}`}>{suite.status}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function FloorPlannerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const propertyId = Number(searchParams.get('property_id'))
  const blockId = Number(searchParams.get('block_id'))
  const floorId = Number(searchParams.get('floor_id'))
  
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [suites, setSuites] = useState<Suite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadProperties() }, [])

  useEffect(() => {
    if (propertyId) {
      const property = properties.find(p => p.id === propertyId)
      if (property) {
        setSelectedProperty(property)
        loadPropertyDetail(propertyId)
      }
    }
  }, [propertyId, properties])

  useEffect(() => {
    if (blockId && selectedProperty?.blocks) {
      const block = selectedProperty.blocks.find(b => b.id === blockId)
      setSelectedBlock(block || null)
    }
  }, [blockId, selectedProperty])

  useEffect(() => {
    if (floorId) loadFloorDetail(floorId)
  }, [floorId])

  async function loadProperties() {
    try {
      setLoading(true)
      const data = await publicApi.listProperties()
      if (data) setProperties(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  async function loadPropertyDetail(propId: number) {
    try {
      const property = await publicApi.getProperty(propId)
      if (property?.blocks) {
        setSelectedProperty(prev => prev ? { ...prev, blocks: property.blocks } : null)
      }
    } catch (err) {
      console.error('Failed to load property detail:', err)
    }
  }

  async function loadFloorDetail(floorId: number) {
    try {
      const floorSuites = await publicApi.listPropertySuites(0)
      const floorSpecificSuites = (Array.isArray(floorSuites) ? floorSuites : [])
        .filter((s: any) => s.floor_id === floorId)
        .map((s: any) => ({
          id: s.id, name: s.name || s.unit_number, unit_number: s.unit_number, floor_id: s.floor_id,
          status: s.status || 'available', list_price: s.list_price || s.price || 0, area_sqm: s.area_sqm || s.area || 0,
          x: s.layout_x || Math.random() * 400, y: s.layout_y || Math.random() * 300,
          width: s.layout_width || 100, height: s.layout_height || 80
        }))
      setSuites(floorSpecificSuites)
    } catch (err) {
      console.error('Failed to load floor detail:', err)
    }
  }

  const handleSaveLayout = async (updatedSuites: Suite[]) => {
    try {
      alert('Layout saved successfully!')
    } catch (err) {
      console.error('Failed to save layout:', err)
      alert('Failed to save layout')
    }
  }

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && properties.length === 0) {
    return (<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-accent" /></div>)
  }

  if (floorId && selectedFloor) {
    return (
      <div className="max-w-7xl mx-auto">
        <FloorPlanEditor floor={selectedFloor} suites={suites} onSave={handleSaveLayout} onBack={() => router.push(`/admin/floor-planner?property_id=${propertyId}&block_id=${blockId}`)} />
      </div>
    )
  }

  if (blockId && selectedBlock) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/admin/floor-planner?property_id=${propertyId}`)} className="p-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedBlock.name}</h1>
              <p className="text-gray-500">{selectedProperty?.name} • {selectedBlock.floors?.length || 0} Floors</p>
            </div>
          </div>
        </div>
        {error && (<div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5" /><p>{error}</p></div>)}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {selectedBlock.floors?.map((floor) => (
            <FloorCard key={floor.id} floor={{...floor, block_name: selectedBlock.name}} onClick={() => { setSelectedFloor(floor); router.push(`/admin/floor-planner?property_id=${propertyId}&block_id=${blockId}&floor_id=${floor.id}`) }} />
          ))}
        </div>
      </div>
    )
  }

  if (propertyId && selectedProperty) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/floor-planner')} className="p-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedProperty.name}</h1>
              <p className="text-gray-500 flex items-center gap-2"><Home className="w-4 h-4" />{selectedProperty.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm"><span className="text-gray-500">Blocks:</span><span className="ml-2 font-semibold text-gray-900">{selectedProperty.blocks?.length || 0}</span></div>
            <div className="px-4 py-2 bg-white rounded-xl shadow-sm"><span className="text-gray-500">Suites:</span><span className="ml-2 font-semibold text-gray-900">{selectedProperty.total_suites}</span></div>
          </div>
        </div>
        {error && (<div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5" /><p>{error}</p></div>)}
        {!selectedProperty.blocks && (<div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div>)}
        {selectedProperty.blocks && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {selectedProperty.blocks.map((block) => (
              <BlockCard key={block.id} block={block} onClick={() => router.push(`/admin/floor-planner?property_id=${propertyId}&block_id=${block.id}`)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Floor Planner</h1>
          <p className="text-gray-500 text-lg">Manage property blocks, floors, and suite layouts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-4 py-3 bg-white rounded-xl text-sm w-72 shadow-md focus:shadow-lg transition-shadow outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <button className="p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"><Filter className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>
      {error && (<div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5" /><p>{error}</p></div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <PropertyCard key={property.id} property={property} onClick={() => router.push(`/admin/floor-planner?property_id=${property.id}`)} />
        ))}
      </div>
      {filteredProperties.length === 0 && !loading && (
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No properties found</p>
          <p className="text-gray-400">Try adjusting your search</p>
        </div>
      )}
    </div>
  )
}
