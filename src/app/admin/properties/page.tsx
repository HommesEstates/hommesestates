'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Building2, Plus, Search, Filter, MoreHorizontal, 
  Eye, Edit3, Trash2, MapPin, Home, Layers, Grid3X3,
  ChevronRight, ArrowUpRight, Loader2, AlertCircle,
  CheckCircle2, XCircle, Calendar
} from 'lucide-react'
import { publicApi, admin } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

interface Property {
  id: number
  name: string
  code?: string
  address?: string
  city?: string
  state?: string
  description?: string
  total_floors: number
  total_suites: number
  available_suites: number
  status: 'draft' | 'published' | 'archived'
  image_url?: string
  created_at?: string
  updated_at?: string
  blocks?: any[]
}

function PropertyCard({ property, onDelete }: { property: Property; onDelete: (id: number) => void }) {
  const statusConfig = {
    published: { color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Published' },
    draft: { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Draft' },
    archived: { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', label: 'Archived' }
  }
  const status = statusConfig[property.status] || statusConfig.draft

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="relative h-48 overflow-hidden">
        {property.image_url ? (
          <Image 
            src={property.image_url} 
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent-dark/20 flex items-center justify-center">
            <Building2 className="w-16 h-16 text-accent/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.color} inline-block mr-1.5`} />
            {status.label}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold text-white truncate">{property.name}</h3>
          {property.code && <p className="text-white/70 text-sm">{property.code}</p>}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-2 text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{property.address || 'No address'}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Layers className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{property.total_floors}</p>
            <p className="text-xs text-gray-500">Floors</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Grid3X3 className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{property.total_suites}</p>
            <p className="text-xs text-gray-500">Suites</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-xl">
            <Home className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{property.available_suites}</p>
            <p className="text-xs text-gray-500">Available</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <Link 
            href={`/admin/properties/${property.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Manage
          </Link>
          <Link 
            href={`/properties/${property.id}`}
            target="_blank"
            className="p-2.5 text-gray-600 hover:text-accent hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => onDelete(property.id)}
            className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function CreatePropertyModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', state: '', description: '' })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate(form)
    setLoading(false)
    setForm({ name: '', code: '', address: '', city: '', state: '', description: '' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Property</h2>
          <p className="text-gray-500 text-sm mt-1">Add a new property to your portfolio</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Name *</label>
              <input 
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="e.g., Fusion Wuse"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Code *</label>
              <input 
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="e.g., FW-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input 
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="e.g., Abuja"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <input 
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                placeholder="Full property address"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                placeholder="Brief description of the property"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    try {
      setLoading(true)
      const data = await publicApi.listProperties()
      if (Array.isArray(data)) {
        const enhanced = await Promise.all(data.map(async (p: any) => {
          try {
            const detail = await publicApi.getProperty(p.id)
            const suites = await publicApi.listPropertySuites(p.id)
            const available = Array.isArray(suites) ? suites.filter((s: any) => s.status === 'available').length : 0
            return {
              ...p,
              total_floors: detail?.blocks?.reduce((acc: number, b: any) => acc + (b.floors?.length || 0), 0) || p.total_floors || 0,
              total_suites: Array.isArray(suites) ? suites.length : p.total_suites || 0,
              available_suites: available,
              status: p.is_published ? 'published' : 'draft'
            }
          } catch {
            return { ...p, status: p.is_published ? 'published' : 'draft' }
          }
        }))
        setProperties(enhanced)
      }
    } catch (err) {
      setError('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProperty(formData: any) {
    try {
      await admin.createProperty(formData)
      await loadProperties()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to create property')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return
    try {
      setProperties(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError('Failed to delete property')
    }
  }

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.address?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: properties.length,
    published: properties.filter(p => p.status === 'published').length,
    draft: properties.filter(p => p.status === 'draft').length,
    totalSuites: properties.reduce((acc, p) => acc + (p.total_suites || 0), 0),
    availableSuites: properties.reduce((acc, p) => acc + (p.available_suites || 0), 0)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Properties</h1>
          <p className="text-gray-500">Manage your real estate portfolio</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-5 h-5" />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Properties</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Published</p>
          <p className="text-3xl font-bold text-green-600">{stats.published}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Suites</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSuites}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Available</p>
          <p className="text-3xl font-bold text-accent">{stats.availableSuites}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {filteredProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No properties found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or create a new property</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreatePropertyModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateProperty}
      />
    </div>
  )
}
