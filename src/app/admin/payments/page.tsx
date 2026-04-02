'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  CreditCard, Plus, Search, Filter, MoreHorizontal, 
  Eye, CheckCircle2, XCircle, Calendar, User,
  Receipt, DollarSign, Loader2, AlertCircle,
  Clock, ArrowRight, Download, FileText
} from 'lucide-react'
import { admin } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'

interface Payment {
  id: number
  payment_number: string
  invoice_number: string
  customer_name: string
  customer_email: string
  amount: number
  payment_method: 'bank_transfer' | 'cash' | 'check' | 'card' | 'crypto'
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_date: string
  reference?: string
  notes?: string
}

const statusConfig = {
  pending: { color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  completed: { color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
  failed: { color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', label: 'Failed' },
  refunded: { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', label: 'Refunded' }
}

const methodConfig = {
  bank_transfer: { label: 'Bank Transfer', icon: ArrowRight },
  cash: { label: 'Cash', icon: DollarSign },
  check: { label: 'Check', icon: FileText },
  card: { label: 'Card', icon: CreditCard },
  crypto: { label: 'Crypto', icon: DollarSign }
}

function PaymentCard({ payment, onView, onDownload }: { 
  payment: Payment; 
  onView: (id: number) => void;
  onDownload: (id: number) => void;
}) {
  const status = statusConfig[payment.status] || statusConfig.pending
  const method = methodConfig[payment.payment_method] || methodConfig.bank_transfer
  const MethodIcon = method.icon

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
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{payment.payment_number}</h3>
            <p className="text-sm text-gray-500">{payment.invoice_number}</p>
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
          <span>{payment.customer_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Receipt className="w-4 h-4 text-gray-400" />
          <span>{method.label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
        </div>
        {payment.reference && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Ref: {payment.reference}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <p className="text-sm text-gray-500">Amount</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onView(payment.id)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>
          {payment.status === 'completed' && (
            <button 
              onClick={() => onDownload(payment.id)}
              className="p-2.5 text-gray-600 hover:text-accent hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function CreatePaymentModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void }) {
  const [form, setForm] = useState({ 
    invoice_number: '', customer_name: '', customer_email: '',
    amount: '', payment_method: 'bank_transfer', payment_date: '',
    reference: '', notes: ''
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onCreate(form)
    setLoading(false)
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
          <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
          <p className="text-gray-500 text-sm mt-1">Record a new payment for an invoice</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number</label>
            <input 
              required
              value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="e.g., INV-001"
            />
          </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
              <input 
                required
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date</label>
            <input 
              type="date"
              required
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference (Optional)</label>
            <input 
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="Transaction reference number"
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
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    try {
      setLoading(true)
      const mockPayments: Payment[] = [
        {
          id: 1,
          payment_number: 'PAY-001',
          invoice_number: 'INV-002',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          amount: 65000000,
          payment_method: 'bank_transfer',
          status: 'completed',
          payment_date: '2024-01-20',
          reference: 'TRX-2024-001'
        },
        {
          id: 2,
          payment_number: 'PAY-002',
          invoice_number: 'INV-001',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          amount: 22500000,
          payment_method: 'card',
          status: 'completed',
          payment_date: '2024-01-18'
        },
        {
          id: 3,
          payment_number: 'PAY-003',
          invoice_number: 'INV-004',
          customer_name: 'Alice Brown',
          customer_email: 'alice@example.com',
          amount: 50000000,
          payment_method: 'check',
          status: 'pending',
          payment_date: '2024-01-25'
        }
      ]
      setPayments(mockPayments)
    } catch (err) {
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreatePayment(formData: any) {
    try {
      const newPayment: Payment = {
        id: payments.length + 1,
        payment_number: `PAY-00${payments.length + 1}`,
        invoice_number: formData.invoice_number,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        status: 'completed',
        payment_date: formData.payment_date,
        reference: formData.reference,
        notes: formData.notes
      }
      setPayments([newPayment, ...payments])
    } catch (err: any) {
      setError(err?.message || 'Failed to record payment')
    }
  }

  async function handleViewPayment(id: number) {
    // Would open payment detail view
  }

  async function handleDownloadReceipt(id: number) {
    // Would trigger receipt download
  }

  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalAmount: payments.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payments</h1>
          <p className="text-gray-500">Manage and track customer payments</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Payments</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Pending</p>
          <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Received</p>
          <p className="text-xl font-bold text-accent">{formatCurrency(stats.totalAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search payments..."
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
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Payments Grid */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No payments found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or record a new payment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <PaymentCard 
              key={payment.id} 
              payment={payment} 
              onView={handleViewPayment}
              onDownload={handleDownloadReceipt}
            />
          ))}
        </div>
      )}

      <CreatePaymentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreatePayment}
      />
    </div>
  )
}
