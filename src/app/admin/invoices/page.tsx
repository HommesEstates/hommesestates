'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Receipt, Plus, Search, Filter, MoreHorizontal, 
  Eye, CheckCircle2, XCircle, Calendar, User,
  Building2, DollarSign, Loader2, AlertCircle,
  Clock, ArrowRight, Download, Send
} from 'lucide-react'
import { admin } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  customer_email: string
  property_name: string
  suite_name: string
  total_amount: number
  amount_due: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  items: InvoiceItem[]
}

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unit_price: number
  amount: number
}

const statusConfig = {
  draft: { color: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', label: 'Draft' },
  sent: { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Sent' },
  paid: { color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Paid' },
  overdue: { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Overdue' },
  cancelled: { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', label: 'Cancelled' }
}

function InvoiceCard({ invoice, onSend, onDownload }: { 
  invoice: Invoice; 
  onSend: (id: number) => void;
  onDownload: (id: number) => void;
}) {
  const status = statusConfig[invoice.status] || statusConfig.draft

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
            <Receipt className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{invoice.invoice_number}</h3>
            <p className="text-sm text-gray-500">{invoice.property_name}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.color} inline-block mr-1.5`} />
          {status.label}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-gray-400" />
          <span>{invoice.customer_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>{invoice.suite_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <button 
              onClick={() => onSend(invoice.id)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          )}
          <button 
            onClick={() => onDownload(invoice.id)}
            className="p-2.5 text-gray-600 hover:text-accent hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function CreateInvoiceModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({ 
    customer_name: '', customer_email: '', property_name: '', suite_name: '',
    issue_date: '', due_date: '', items: [{ description: '', quantity: 1, unit_price: 0 }]
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm({ ...form, items: newItems })
  }

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const calculateTotal = () => {
    return form.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate({ ...form, total_amount: calculateTotal() })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>
          <p className="text-gray-500 text-sm mt-1">Generate a new invoice for a customer</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property</label>
              <input 
                required
                value={form.property_name}
                onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Suite</label>
              <input 
                value={form.suite_name}
                onChange={(e) => setForm({ ...form, suite_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
              <input 
                type="date"
                required
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <input 
                type="date"
                required
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Invoice Items</h3>
              <button 
                type="button"
                onClick={addItem}
                className="text-sm text-accent hover:text-accent-dark font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <input 
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input 
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    {form.items.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-accent">{formatCurrency(calculateTotal())}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    try {
      setLoading(true)
      const mockInvoices: Invoice[] = [
        {
          id: 1,
          invoice_number: 'INV-001',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          property_name: 'Fusion Wuse',
          suite_name: 'Suite 101 - 2 Bedroom',
          total_amount: 45000000,
          amount_due: 45000000,
          status: 'sent',
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          items: []
        },
        {
          id: 2,
          invoice_number: 'INV-002',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          property_name: 'Fusion Wuse',
          suite_name: 'Suite 102 - 3 Bedroom',
          total_amount: 65000000,
          amount_due: 0,
          status: 'paid',
          issue_date: '2024-01-10',
          due_date: '2024-02-10',
          items: []
        },
        {
          id: 3,
          invoice_number: 'INV-003',
          customer_name: 'Bob Johnson',
          customer_email: 'bob@example.com',
          property_name: 'Premium Heights',
          suite_name: 'Suite 201 - Penthouse',
          total_amount: 120000000,
          amount_due: 120000000,
          status: 'overdue',
          issue_date: '2023-12-01',
          due_date: '2024-01-01',
          items: []
        }
      ]
      setInvoices(mockInvoices)
    } catch (err) {
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateInvoice(formData: any) {
    try {
      const newInvoice: Invoice = {
        id: invoices.length + 1,
        invoice_number: `INV-00${invoices.length + 1}`,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        property_name: formData.property_name,
        suite_name: formData.suite_name,
        total_amount: formData.total_amount,
        amount_due: formData.total_amount,
        status: 'draft',
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        items: formData.items
      }
      setInvoices([newInvoice, ...invoices])
    } catch (err: any) {
      setError(err?.message || 'Failed to create invoice')
    }
  }

  async function handleSendInvoice(id: number) {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'sent' as const } : inv))
  }

  async function handleDownloadInvoice(id: number) {
    // Would trigger PDF download
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.property_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalOutstanding: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((acc, i) => acc + i.amount_due, 0)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoices</h1>
          <p className="text-gray-500">Manage customer invoices and payments</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Draft</p>
          <p className="text-3xl font-bold text-gray-600">{stats.draft}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Sent</p>
          <p className="text-3xl font-bold text-blue-600">{stats.sent}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Paid</p>
          <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Overdue</p>
          <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Outstanding</p>
          <p className="text-xl font-bold text-accent">{formatCurrency(stats.totalOutstanding)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search invoices..."
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
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Invoices Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No invoices found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or create a new invoice</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard 
              key={invoice.id} 
              invoice={invoice} 
              onSend={handleSendInvoice}
              onDownload={handleDownloadInvoice}
            />
          ))}
        </div>
      )}

      <CreateInvoiceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateInvoice}
      />
    </div>
  )
}
