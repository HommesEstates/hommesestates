'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, Plus, Search, Filter, MoreHorizontal, 
  Mail, Phone, Building2, MapPin, FileText,
  DollarSign, Loader2, AlertCircle, Eye,
  Edit3, Trash2, UserPlus, Briefcase,
  CheckCircle2, XCircle, Star
} from 'lucide-react'
import { admin } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'

type CustomerType = 'individual' | 'company' | 'partner'
type CustomerStatus = 'active' | 'inactive' | 'prospect' | 'vip'

interface Customer {
  id: number
  type: CustomerType
  status: CustomerStatus
  first_name?: string
  last_name?: string
  company_name?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
  notes?: string
  total_spent: number
  total_orders: number
  created_at: string
  last_contact?: string
  tags?: string[]
}

const typeConfig = {
  individual: { icon: Users, label: 'Individual', color: 'bg-blue-100 text-blue-700' },
  company: { icon: Building2, label: 'Company', color: 'bg-purple-100 text-purple-700' },
  partner: { icon: Briefcase, label: 'Partner', color: 'bg-amber-100 text-amber-700' }
}

const statusConfig = {
  active: { color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Active' },
  inactive: { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', label: 'Inactive' },
  prospect: { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Prospect' },
  vip: { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'VIP' }
}

function CustomerCard({ customer, onEdit, onDelete }: { 
  customer: Customer; 
  onEdit: (c: Customer) => void;
  onDelete: (id: number) => void;
}) {
  const type = typeConfig[customer.type]
  const status = statusConfig[customer.status]
  const TypeIcon = type.icon
  const fullName = customer.type === 'individual' 
    ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : customer.company_name

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
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type.color}`}>
            <TypeIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{fullName || 'Unnamed'}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${type.color}`}>
              {type.label}
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.color} inline-block mr-1.5`} />
          {status.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{customer.email}</span>
        </div>
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{customer.city}{customer.country ? `, ${customer.country}` : ''}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(customer.total_spent)}</p>
          <p className="text-xs text-gray-500">Total Spent</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{customer.total_orders}</p>
          <p className="text-xs text-gray-500">Orders</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onEdit(customer)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Edit
        </button>
        <button 
          onClick={() => onDelete(customer.id)}
          className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

function CreateCustomerModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({ 
    type: 'individual', first_name: '', last_name: '', company_name: '',
    email: '', phone: '', address: '', city: '', country: '',
    notes: '', tags: ''
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate({
      ...form,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    })
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
          <h2 className="text-xl font-bold text-gray-900">Add Customer/Partner</h2>
          <p className="text-gray-500 text-sm mt-1">Create a new customer or partner record</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['individual', 'company', 'partner'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    form.type === t 
                      ? 'bg-accent text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'individual' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input 
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input 
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <input 
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input 
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input 
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <input 
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input 
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <input 
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma-separated)</label>
            <input 
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g., VIP, Investor, Referral"
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
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      setLoading(true)
      const mockCustomers: Customer[] = [
        {
          id: 1,
          type: 'individual',
          status: 'vip',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+234 123 456 7890',
          city: 'Abuja',
          country: 'Nigeria',
          total_spent: 125000000,
          total_orders: 3,
          created_at: '2023-06-15'
        },
        {
          id: 2,
          type: 'company',
          status: 'active',
          company_name: 'ABC Properties Ltd',
          email: 'contact@abcprops.com',
          phone: '+234 987 654 3210',
          city: 'Lagos',
          country: 'Nigeria',
          total_spent: 250000000,
          total_orders: 5,
          created_at: '2023-03-10'
        },
        {
          id: 3,
          type: 'partner',
          status: 'active',
          company_name: 'Real Estate Partners',
          email: 'partners@realestate.com',
          phone: '+234 555 123 4567',
          city: 'Abuja',
          country: 'Nigeria',
          total_spent: 0,
          total_orders: 0,
          created_at: '2023-08-20'
        },
        {
          id: 4,
          type: 'individual',
          status: 'prospect',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          city: 'Port Harcourt',
          country: 'Nigeria',
          total_spent: 0,
          total_orders: 0,
          created_at: '2024-01-05'
        }
      ]
      setCustomers(mockCustomers)
    } catch (err) {
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCustomer(formData: any) {
    try {
      const newCustomer: Customer = {
        id: customers.length + 1,
        ...formData,
        status: 'active',
        total_spent: 0,
        total_orders: 0,
        created_at: new Date().toISOString()
      }
      setCustomers([newCustomer, ...customers])
    } catch (err: any) {
      setError(err?.message || 'Failed to create customer')
    }
  }

  async function handleEditCustomer(customer: Customer) {
    // Would open edit modal
  }

  async function handleDeleteCustomer(id: number) {
    if (!confirm('Are you sure you want to delete this customer?')) return
    setCustomers(customers.filter(c => c.id !== id))
  }

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase()
    const fullName = c.type === 'individual' 
      ? `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
      : (c.company_name || '').toLowerCase()
    
    const matchesSearch = 
      fullName.includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      (c.phone || '').toLowerCase().includes(searchLower)
    
    const matchesType = typeFilter === 'all' || c.type === typeFilter
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: customers.length,
    individuals: customers.filter(c => c.type === 'individual').length,
    companies: customers.filter(c => c.type === 'company').length,
    partners: customers.filter(c => c.type === 'partner').length,
    active: customers.filter(c => c.status === 'active' || c.status === 'vip').length,
    totalRevenue: customers.reduce((acc, c) => acc + c.total_spent, 0)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customers & Partners</h1>
          <p className="text-gray-500">Manage your customer relationships and partnerships</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
        >
          <UserPlus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Individuals</p>
          <p className="text-3xl font-bold text-blue-600">{stats.individuals}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Companies</p>
          <p className="text-3xl font-bold text-purple-600">{stats.companies}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Partners</p>
          <p className="text-3xl font-bold text-amber-600">{stats.partners}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-accent">{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">All Types</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
          <option value="partner">Partner</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="vip">VIP</option>
          <option value="prospect">Prospect</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No customers found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new customer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <CustomerCard 
              key={customer.id} 
              customer={customer} 
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
            />
          ))}
        </div>
      )}

      <CreateCustomerModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCustomer}
      />
    </div>
  )
}
