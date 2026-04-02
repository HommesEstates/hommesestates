'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, ArrowLeft, Save, Loader2, AlertCircle,
  Layers, Grid3X3, Image as ImageIcon, FileText, Settings,
  Plus, Trash2, Edit3, Eye, ChevronRight, MapPin, DollarSign,
  Box, ArrowUpDown, Upload, X
} from 'lucide-react'
import { publicApi, admin } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

type Tab = 'details' | 'blocks' | 'floors' | 'suites' | 'images' | 'settings'

interface Block {
  id: number
  name: string
  code: string
  total_floors?: number
  total_suites?: number
  floors?: Floor[]
}

interface Floor {
  id: number
  name: string
  floor_number: number
  block_id: number
  block_name?: string
  total_suites?: number
  available_suites?: number
}

interface Suite {
  id: number
  name: string
  unit_number: string
  floor_id: number
  floor_name?: string
  status: 'available' | 'reserved' | 'sold'
  list_price: number
  area_sqm: number
}

function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'blocks', label: 'Blocks', icon: Box },
    { id: 'floors', label: 'Floors', icon: Layers },
    { id: 'suites', label: 'Suites', icon: Grid3X3 },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
              isActive 
                ? 'bg-white text-accent shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

function DetailsTab({ property, onSave }: { property: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState(property || {})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Name</label>
            <input 
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Code</label>
            <input 
              value={form.code || ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input 
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input 
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <input 
                value={form.state || ''}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea 
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Features (comma-separated)</label>
            <input 
              value={form.features?.join(', ') || ''}
              onChange={(e) => setForm({ ...form, features: e.target.value.split(',').map((f: string) => f.trim()) })}
              placeholder="e.g., Swimming Pool, Gym, Parking"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}

function BlocksTab({ blocks, onRefresh }: { blocks: Block[]; onRefresh: () => void }) {
  const [newBlock, setNewBlock] = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500))
      setNewBlock({ name: '', code: '' })
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
        <input 
          placeholder="Block Name"
          value={newBlock.name}
          onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
        <input 
          placeholder="Block Code"
          value={newBlock.code}
          onChange={(e) => setNewBlock({ ...newBlock, code: e.target.value })}
          className="w-48 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
        <button 
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map((block) => (
          <motion.div 
            key={block.id}
            layout
            className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-accent" />
              </div>
              <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{block.name}</h3>
            <p className="text-sm text-gray-500 mb-3">Code: {block.code}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{block.total_floors || 0} floors</span>
              <span>{block.total_suites || 0} suites</span>
            </div>
          </motion.div>
        ))}
        {blocks.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
            <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No blocks yet. Create your first block above.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FloorsTab({ floors, blocks, onRefresh }: { floors: Floor[]; blocks: Block[]; onRefresh: () => void }) {
  const [newFloor, setNewFloor] = useState({ name: '', block_id: '', floor_number: 1 })
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500))
      setNewFloor({ name: '', block_id: '', floor_number: 1 })
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
        <select
          value={newFloor.block_id}
          onChange={(e) => setNewFloor({ ...newFloor, block_id: e.target.value })}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        >
          <option value="">Select Block</option>
          {blocks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input 
          placeholder="Floor Name"
          value={newFloor.name}
          onChange={(e) => setNewFloor({ ...newFloor, name: e.target.value })}
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
        <input 
          type="number"
          placeholder="Floor Number"
          value={newFloor.floor_number}
          onChange={(e) => setNewFloor({ ...newFloor, floor_number: parseInt(e.target.value) })}
          className="w-32 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
        <button 
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Floor
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">Floor</th>
              <th className="text-left p-4 font-medium text-gray-700">Block</th>
              <th className="text-left p-4 font-medium text-gray-700">Number</th>
              <th className="text-left p-4 font-medium text-gray-700">Suites</th>
              <th className="text-right p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {floors.map((floor) => (
              <tr key={floor.id} className="bg-white hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Layers className="w-5 h-5 text-accent" />
                    </div>
                    <span className="font-medium text-gray-900">{floor.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{floor.block_name}</td>
                <td className="p-4 text-gray-600">{floor.floor_number}</td>
                <td className="p-4">
                  <span className="text-green-600 font-medium">{floor.available_suites || 0}</span>
                  <span className="text-gray-400"> / {floor.total_suites || 0}</span>
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {floors.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p>No floors yet. Add your first floor above.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SuitesTab({ suites, floors, onRefresh }: { suites: Suite[]; floors: Floor[]; onRefresh: () => void }) {
  const [newSuite, setNewSuite] = useState({ 
    name: '', unit_number: '', floor_id: '', list_price: '', area_sqm: '' 
  })
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500))
      setNewSuite({ name: '', unit_number: '', floor_id: '', list_price: '', area_sqm: '' })
      onRefresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl">
        <select
          value={newSuite.floor_id}
          onChange={(e) => setNewSuite({ ...newSuite, floor_id: e.target.value })}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        >
          <option value="">Select Floor</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <input 
          placeholder="Suite Name"
          value={newSuite.name}
          onChange={(e) => setNewSuite({ ...newSuite, name: e.target.value })}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
        <input 
          placeholder="Unit Number"
          value={newSuite.unit_number}
          onChange={(e) => setNewSuite({ ...newSuite, unit_number: e.target.value })}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
        <input 
          type="number"
          placeholder="Price"
          value={newSuite.list_price}
          onChange={(e) => setNewSuite({ ...newSuite, list_price: e.target.value })}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          required
        />
        <button 
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Suite
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">Suite</th>
              <th className="text-left p-4 font-medium text-gray-700">Floor</th>
              <th className="text-left p-4 font-medium text-gray-700">Unit #</th>
              <th className="text-left p-4 font-medium text-gray-700">Area</th>
              <th className="text-left p-4 font-medium text-gray-700">Price</th>
              <th className="text-left p-4 font-medium text-gray-700">Status</th>
              <th className="text-right p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {suites.map((suite) => (
              <tr key={suite.id} className="bg-white hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      suite.status === 'available' ? 'bg-green-100' : 
                      suite.status === 'reserved' ? 'bg-amber-100' : 'bg-gray-100'
                    }`}>
                      <Grid3X3 className={`w-5 h-5 ${
                        suite.status === 'available' ? 'text-green-600' : 
                        suite.status === 'reserved' ? 'text-amber-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className="font-medium text-gray-900">{suite.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-600">{suite.floor_name}</td>
                <td className="p-4 text-gray-600">{suite.unit_number}</td>
                <td className="p-4 text-gray-600">{suite.area_sqm} m²</td>
                <td className="p-4 font-medium text-gray-900">{formatCurrency(suite.list_price)}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    suite.status === 'available' ? 'bg-green-100 text-green-700' : 
                    suite.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {suite.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {suites.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  <Grid3X3 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p>No suites yet. Add your first suite above.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PropertyDetailPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const propertyId = Number(params?.id || 0)
  
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [property, setProperty] = useState<any>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [suites, setSuites] = useState<Suite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (propertyId) loadData()
  }, [propertyId])

  async function loadData() {
    try {
      setLoading(true)
      const propData = await publicApi.getProperty(propertyId)
      setProperty(propData)
      
      if (propData?.blocks) {
        setBlocks(propData.blocks)
        const allFloors: Floor[] = []
        propData.blocks.forEach((block: any) => {
          if (block.floors) {
            block.floors.forEach((floor: any) => {
              allFloors.push({ ...floor, block_id: block.id, block_name: block.name })
            })
          }
        })
        setFloors(allFloors)
      }
      
      const suitesData = await publicApi.listPropertySuites(propertyId)
      if (Array.isArray(suitesData)) {
        setSuites(suitesData.map((s: any) => ({
          ...s,
          floor_name: floors.find(f => f.id === s.floor_id)?.name || 'Unknown'
        })))
      }
    } catch (err) {
      setError('Failed to load property data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
        <Link href="/admin/properties" className="text-accent hover:underline">Back to Properties</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/admin/properties')} 
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {property.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-gray-500 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {property.address || 'No address'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={`/properties/${propertyId}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View on Site
          </Link>
          <Link 
            href={`/admin/floor-planner?property_id=${propertyId}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
          >
            <Layers className="w-4 h-4" />
            Floor Planner
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Blocks</p>
          <p className="text-3xl font-bold text-gray-900">{blocks.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Floors</p>
          <p className="text-3xl font-bold text-gray-900">{floors.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Suites</p>
          <p className="text-3xl font-bold text-gray-900">{suites.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Available</p>
          <p className="text-3xl font-bold text-green-600">
            {suites.filter(s => s.status === 'available').length}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      <Tabs active={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          {activeTab === 'details' && (
            <DetailsTab property={property} onSave={(data) => setProperty({ ...property, ...data })} />
          )}
          {activeTab === 'blocks' && (
            <BlocksTab blocks={blocks} onRefresh={loadData} />
          )}
          {activeTab === 'floors' && (
            <FloorsTab floors={floors} blocks={blocks} onRefresh={loadData} />
          )}
          {activeTab === 'suites' && (
            <SuitesTab suites={suites} floors={floors} onRefresh={loadData} />
          )}
          {activeTab === 'images' && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Image management coming soon</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Advanced settings coming soon</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
