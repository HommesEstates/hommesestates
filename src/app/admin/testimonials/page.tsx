'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Quote, Star, Plus, Trash2, GripVertical, User, 
  Building2, Edit3, ChevronUp, ChevronDown, Save,
  Loader2, AlertCircle, CheckCircle2, Image as ImageIcon,
  Search, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  quote: string
  rating: number
  avatarUrl: string
  isActive: boolean
  order: number
}

const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'John Smith',
    role: 'CEO',
    company: 'Tech Solutions Ltd',
    quote: 'Hommes Estates made finding our dream home incredibly easy. Their team was professional and knowledgeable throughout the entire process.',
    rating: 5,
    avatarUrl: '',
    isActive: true,
    order: 1
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'Global Brands Inc',
    quote: 'The property listings were accurate and the viewing process was seamless. I highly recommend their services.',
    rating: 5,
    avatarUrl: '',
    isActive: true,
    order: 2
  },
  {
    id: '3',
    name: 'Michael Brown',
    role: 'Investor',
    company: 'MB Investments',
    quote: 'Excellent service and great property options. They helped me find the perfect investment property.',
    rating: 4,
    avatarUrl: '',
    isActive: true,
    order: 3
  }
]

function TestimonialCard({ testimonial, onEdit, onDelete, onToggle, onMove, isFirst, isLast }: {
  testimonial: Testimonial
  onEdit: (t: Testimonial) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all ${
        !testimonial.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col gap-1">
          <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing rounded-lg hover:bg-gray-100">
            <GripVertical className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onMove(testimonial.id, 'up')}
            disabled={isFirst}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onMove(testimonial.id, 'down')}
            disabled={isLast}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          {testimonial.avatarUrl ? (
            <img src={testimonial.avatarUrl} alt={testimonial.name} className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <User className="w-8 h-8 text-accent" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
              <p className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</p>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(testimonial.id, !testimonial.isActive)}
                className={`w-10 h-6 rounded-full transition-colors ${testimonial.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${testimonial.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
              <button 
                onClick={() => onEdit(testimonial)}
                className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(testimonial.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <blockquote className="mt-4 text-gray-600 italic">
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>
        </div>
      </div>
    </motion.div>
  )
}

function TestimonialModal({ isOpen, onClose, onSave, testimonial }: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  testimonial?: Testimonial | null
}) {
  const [form, setForm] = useState({
    name: '',
    role: '',
    company: '',
    quote: '',
    rating: 5,
    avatarUrl: '',
    isActive: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (testimonial) {
      setForm({
        name: testimonial.name,
        role: testimonial.role,
        company: testimonial.company,
        quote: testimonial.quote,
        rating: testimonial.rating,
        avatarUrl: testimonial.avatarUrl,
        isActive: testimonial.isActive
      })
    }
  }, [testimonial])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave(form)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{testimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
          <p className="text-gray-500 text-sm mt-1">Manage client testimonials and reviews</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
              <input 
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <input 
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder="CEO"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
            <input 
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Company Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quote *</label>
            <textarea 
              required
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder="What did they say about your service?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating (1-5)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="p-1"
                  >
                    <Star className={`w-6 h-6 ${star <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Avatar URL</label>
            <input 
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
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
              {loading ? 'Saving...' : testimonial ? 'Save Changes' : 'Add Testimonial'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)

  useEffect(() => {
    loadTestimonials()
  }, [])

  async function loadTestimonials() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/testimonials')
      if (res.ok) {
        const data = await res.json()
        setTestimonials(data)
      } else {
        setTestimonials(mockTestimonials)
      }
    } catch (e) {
      setTestimonials(mockTestimonials)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData: any) {
    try {
      if (editingTestimonial) {
        const res = await fetch(`/api/admin/testimonials/${editingTestimonial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to update')
        setTestimonials(testimonials.map(t => t.id === editingTestimonial.id ? { ...t, ...formData } : t))
        toast.success('Testimonial updated')
      } else {
        const res = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to create')
        const newTestimonial: Testimonial = {
          ...formData,
          id: String(testimonials.length + 1),
          order: testimonials.length + 1
        }
        setTestimonials([...testimonials, newTestimonial])
        toast.success('Testimonial added')
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    try {
      await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
      setTestimonials(testimonials.filter(t => t.id !== id))
      toast.success('Testimonial deleted')
    } catch (e) {
      toast.error('Failed to delete')
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active })
      })
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, isActive: active } : t))
    } catch (e) {
      // Mock toggle
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, isActive: active } : t))
    }
  }

  async function handleMove(id: string, direction: 'up' | 'down') {
    const idx = testimonials.findIndex(t => t.id === id)
    if (direction === 'up' && idx > 0) {
      const newTestimonials = [...testimonials]
      ;[newTestimonials[idx], newTestimonials[idx - 1]] = [newTestimonials[idx - 1], newTestimonials[idx]]
      setTestimonials(newTestimonials)
    } else if (direction === 'down' && idx < testimonials.length - 1) {
      const newTestimonials = [...testimonials]
      ;[newTestimonials[idx], newTestimonials[idx + 1]] = [newTestimonials[idx + 1], newTestimonials[idx]]
      setTestimonials(newTestimonials)
    }
  }

  const filteredTestimonials = testimonials.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.quote.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: testimonials.length,
    active: testimonials.filter(t => t.isActive).length,
    avgRating: testimonials.length > 0 
      ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
      : '0'
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Testimonials</h1>
          <p className="text-gray-500">Manage customer testimonials and reviews</p>
        </div>
        <button 
          onClick={() => { setEditingTestimonial(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Testimonials</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Average Rating</p>
          <p className="text-3xl font-bold text-amber-500">{stats.avgRating}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          type="text"
          placeholder="Search testimonials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        />
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {filteredTestimonials.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Quote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No testimonials found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first testimonial to get started</p>
          </div>
        ) : (
          filteredTestimonials.map((testimonial, idx) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              onEdit={(t) => { setEditingTestimonial(t); setIsModalOpen(true); }}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onMove={handleMove}
              isFirst={idx === 0}
              isLast={idx === filteredTestimonials.length - 1}
            />
          ))
        )}
      </div>

      <TestimonialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        testimonial={editingTestimonial}
      />
    </div>
  )
}
