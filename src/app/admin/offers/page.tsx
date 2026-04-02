'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  FileText, Plus, Search, Filter, MoreHorizontal, 
  Eye, CheckCircle2, XCircle, Calendar, User,
  Building2, DollarSign, Loader2, AlertCircle,
  Clock, ArrowRight, Download
} from 'lucide-react'
import { admin } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'

interface Offer {
  id: number
  offer_number: string
  property_id: number
  property_name: string
  suite_id: number
  suite_name: string
  customer_name: string
  customer_email: string
  offer_amount: number
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  expires_at?: string
  notes?: string
}

const statusConfig = {
  draft: { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', label: 'Draft' },
  submitted: { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Submitted' },
  under_review: { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Under Review' },
  accepted: { color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
  rejected: { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
  expired: { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', label: 'Expired' }
}

function OfferCard({ offer, onConfirm, onCancel }: { 
  offer: Offer; 
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
}) {
  const status = statusConfig[offer.status] || statusConfig.draft

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{offer.offer_number}</h3>
            <p className="text-sm text-gray-500">{offer.property_name}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.color} inline-block mr-1.5`} />
          {status.label}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>{offer.suite_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-gray-400" />
          <span>{offer.customer_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{formatCurrency(offer.offer_amount)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Created {new Date(offer.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        {offer.status === 'submitted' && (
          <>
            <button 
              onClick={() => onConfirm(offer.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm
            </button>
            <button 
              onClick={() => onCancel(offer.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}
        {offer.status === 'accepted' && (
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">
            <Download className="w-4 h-4" />
            Generate Docs
          </button>
        )}
        <button className="p-2.5 text-gray-600 hover:text-accent hover:bg-gray-50 rounded-xl transition-colors">
          <Eye className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

function CreateOfferModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({ 
    property_id: '', suite_id: '', customer_name: '', customer_email: '', 
    offer_amount: '', notes: '' 
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate(form)
    setLoading(false)
    setForm({ property_id: '', suite_id: '', customer_name: '', customer_email: '', offer_amount: '', notes: '' })
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
          <h2 className="text-xl font-bold text-gray-900">Create New Offer</h2>
          <p className="text-gray-500 text-sm mt-1">Submit a new offer for a property</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property ID</label>
              <input 
                required
                type="number"
                value={form.property_id}
                onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Suite ID</label>
              <input 
                required
                type="number"
                value={form.suite_id}
                onChange={(e) => setForm({ ...form, suite_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Name</label>
            <input 
              required
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Customer Email</label>
            <input 
              type="email"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Offer Amount</label>
            <input 
              required
              type="number"
              value={form.offer_amount}
              onChange={(e) => setForm({ ...form, offer_amount: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea 
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            />
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
              {loading ? 'Creating...' : 'Create Offer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadOffers()
  }, [])

  async function loadOffers() {
    try {
      setLoading(true)
      // Mock data for now
      const mockOffers: Offer[] = [
        {
          id: 1,
          offer_number: 'OFF-001',
          property_id: 1,
          property_name: 'Fusion Wuse',
          suite_id: 1,
          suite_name: 'Suite 101 - 2 Bedroom',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          offer_amount: 45000000,
          status: 'submitted',
          created_at: '2024-01-15'
        },
        {
          id: 2,
          offer_number: 'OFF-002',
          property_id: 1,
          property_name: 'Fusion Wuse',
          suite_id: 2,
          suite_name: 'Suite 102 - 3 Bedroom',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          offer_amount: 65000000,
          status: 'accepted',
          created_at: '2024-01-14'
        },
        {
          id: 3,
          offer_number: 'OFF-003',
          property_id: 2,
          property_name: 'Premium Heights',
          suite_id: 3,
          suite_name: 'Suite 201 - Penthouse',
          customer_name: 'Bob Johnson',
          customer_email: 'bob@example.com',
          offer_amount: 120000000,
          status: 'under_review',
          created_at: '2024-01-13'
        }
      ]
      setOffers(mockOffers)
    } catch (err) {
      setError('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateOffer(formData: any) {
    try {
      const newOffer: Offer = {
        id: offers.length + 1,
        offer_number: `OFF-00${offers.length + 1}`,
        property_id: parseInt(formData.property_id),
        property_name: 'New Property',
        suite_id: parseInt(formData.suite_id),
        suite_name: 'New Suite',
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        offer_amount: parseFloat(formData.offer_amount),
        status: 'submitted',
        created_at: new Date().toISOString()
      }
      setOffers([newOffer, ...offers])
    } catch (err: any) {
      setError(err?.message || 'Failed to create offer')
    }
  }

  async function handleConfirmOffer(id: number) {
    setOffers(offers.map(o => o.id === id ? { ...o, status: 'accepted' as const } : o))
  }

  async function handleCancelOffer(id: number) {
    setOffers(offers.map(o => o.id === id ? { ...o, status: 'rejected' as const } : o))
  }

  const filteredOffers = offers.filter(o => {
    const matchesSearch = 
      o.offer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.property_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: offers.length,
    submitted: offers.filter(o => o.status === 'submitted').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    underReview: offers.filter(o => o.status === 'under_review').length,
    totalValue: offers.reduce((acc, o) => acc + o.offer_amount, 0)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Offers</h1>
          <p className="text-gray-500">Manage property offers and negotiations</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-5 h-5" />
          Create Offer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Offers</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Submitted</p>
          <p className="text-3xl font-bold text-blue-600">{stats.submitted}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Under Review</p>
          <p className="text-3xl font-bold text-amber-600">{stats.underReview}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Accepted</p>
          <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(stats.totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search offers..."
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
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No offers found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or create a new offer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <OfferCard 
              key={offer.id} 
              offer={offer} 
              onConfirm={handleConfirmOffer}
              onCancel={handleCancelOffer}
            />
          ))}
        </div>
      )}

      <CreateOfferModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateOffer}
      />
    </div>
  )
}
