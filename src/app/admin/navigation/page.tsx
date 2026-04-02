'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Menu, Plus, Search, GripVertical, Eye, ExternalLink,
  Trash2, Edit3, ChevronRight, ChevronDown, Home,
  Layout, FileText, Settings, Image as ImageIcon,
  Loader2, AlertCircle, CheckCircle2, Save,
  ArrowUp, ArrowDown, X
} from 'lucide-react'
import { admin } from '@/lib/backend'

type MenuLocation = 'header' | 'footer' | 'sidebar' | 'mobile'
type LinkTarget = '_self' | '_blank'

interface NavItem {
  id: number
  label: string
  url: string
  icon?: string
  location: MenuLocation
  parent_id?: number | null
  order_index: number
  is_active: boolean
  target: LinkTarget
  children?: NavItem[]
}

const locationConfig = {
  header: { label: 'Header Menu', color: 'bg-blue-100 text-blue-700' },
  footer: { label: 'Footer Menu', color: 'bg-green-100 text-green-700' },
  sidebar: { label: 'Sidebar Menu', color: 'bg-purple-100 text-purple-700' },
  mobile: { label: 'Mobile Menu', color: 'bg-amber-100 text-amber-700' }
}

function NavItemRow({ item, depth = 0, onEdit, onDelete, onToggle, allItems }: { 
  item: NavItem; 
  depth?: number;
  onEdit: (item: NavItem) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  allItems: NavItem[];
}) {
  const [expanded, setExpanded] = useState(false)
  const children = allItems.filter(i => i.parent_id === item.id)
  const hasChildren = children.length > 0

  return (
    <div className="space-y-1">
      <motion.div
        layout
        className={`flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all ${
          !item.is_active ? 'opacity-60' : ''
        }`}
        style={{ marginLeft: depth * 32 }}
      >
        <button className="p-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </button>

        {hasChildren && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        {!hasChildren && <div className="w-7" />}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.label}</span>
            {item.target === '_blank' && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                <ExternalLink className="w-3 h-3 inline mr-1" />
                New Tab
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{item.url}</p>
        </div>

        <span className={`text-xs px-2 py-1 rounded-full ${locationConfig[item.location].color}`}>
          {locationConfig[item.location].label}
        </span>

        <button
          onClick={() => onToggle(item.id)}
          className={`w-10 h-6 rounded-full transition-colors ${item.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${item.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>

        <button 
          onClick={() => onEdit(item)}
          className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button 
          onClick={() => onDelete(item.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>

      {expanded && hasChildren && (
        <div className="space-y-1">
          {children.map(child => (
            <NavItemRow
              key={child.id}
              item={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              allItems={allItems}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NavItemModal({ isOpen, onClose, onSave, item, parentOptions }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  item?: NavItem | null;
  parentOptions: NavItem[];
}) {
  const [form, setForm] = useState({
    label: '',
    url: '',
    location: 'header' as MenuLocation,
    parent_id: '',
    target: '_self' as LinkTarget,
    is_active: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        label: item.label,
        url: item.url,
        location: item.location,
        parent_id: item.parent_id?.toString() || '',
        target: item.target,
        is_active: item.is_active
      })
    }
  }, [item])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave({
      ...form,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null
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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{item ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
          <p className="text-gray-500 text-sm mt-1">Configure navigation menu item</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Label *</label>
            <input 
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="e.g., Properties"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL *</label>
            <input 
              required
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="/properties or https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Menu Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value as MenuLocation })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="sidebar">Sidebar</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Item</label>
              <select
                value={form.parent_id}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="">None (Top Level)</option>
                {parentOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Open In</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value as LinkTarget })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="_self">Same Tab</option>
                <option value="_blank">New Tab</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
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
              {loading ? 'Saving...' : 'Save Menu Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function NavigationPage() {
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NavItem | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    try {
      setLoading(true)
      const mockItems: NavItem[] = [
        {
          id: 1,
          label: 'Home',
          url: '/',
          location: 'header',
          order_index: 1,
          is_active: true,
          target: '_self'
        },
        {
          id: 2,
          label: 'Properties',
          url: '/properties',
          location: 'header',
          order_index: 2,
          is_active: true,
          target: '_self'
        },
        {
          id: 3,
          label: 'For Sale',
          url: '/properties?type=sale',
          location: 'header',
          parent_id: 2,
          order_index: 1,
          is_active: true,
          target: '_self'
        },
        {
          id: 4,
          label: 'For Rent',
          url: '/properties?type=rent',
          location: 'header',
          parent_id: 2,
          order_index: 2,
          is_active: true,
          target: '_self'
        },
        {
          id: 5,
          label: 'About Us',
          url: '/about',
          location: 'header',
          order_index: 3,
          is_active: true,
          target: '_self'
        },
        {
          id: 6,
          label: 'Contact',
          url: '/contact',
          location: 'header',
          order_index: 4,
          is_active: true,
          target: '_self'
        },
        {
          id: 7,
          label: 'Privacy Policy',
          url: '/privacy',
          location: 'footer',
          order_index: 1,
          is_active: true,
          target: '_self'
        },
        {
          id: 8,
          label: 'Terms of Service',
          url: '/terms',
          location: 'footer',
          order_index: 2,
          is_active: true,
          target: '_self'
        }
      ]
      setItems(mockItems)
    } catch (err) {
      setError('Failed to load navigation items')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveItem(formData: any) {
    try {
      if (editingItem) {
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } : i))
      } else {
        const newItem: NavItem = {
          id: items.length + 1,
          ...formData,
          order_index: items.length + 1
        }
        setItems([...items, newItem])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save item')
    }
  }

  async function handleDeleteItem(id: number) {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    setItems(items.filter(i => i.id !== id))
  }

  async function handleToggleItem(id: number) {
    setItems(items.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i))
  }

  async function handleSaveOrder() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
  }

  const rootItems = items.filter(i => !i.parent_id)
  
  const filteredItems = rootItems.filter(item => {
    const matchesSearch = 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = locationFilter === 'all' || item.location === locationFilter
    return matchesSearch && matchesLocation
  })

  const parentOptions = items.filter(i => !i.parent_id)

  const stats = {
    total: items.length,
    header: items.filter(i => i.location === 'header').length,
    footer: items.filter(i => i.location === 'footer').length,
    sidebar: items.filter(i => i.location === 'sidebar').length,
    active: items.filter(i => i.is_active).length
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Navigation</h1>
          <p className="text-gray-500">Manage your website navigation menus</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveOrder}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Order
          </button>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
          >
            <Plus className="w-5 h-5" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Items</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Header</p>
          <p className="text-3xl font-bold text-blue-600">{stats.header}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Footer</p>
          <p className="text-3xl font-bold text-green-600">{stats.footer}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Sidebar</p>
          <p className="text-3xl font-bold text-purple-600">{stats.sidebar}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <select 
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">All Locations</option>
          <option value="header">Header</option>
          <option value="footer">Footer</option>
          <option value="sidebar">Sidebar</option>
          <option value="mobile">Mobile</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Navigation Items */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Menu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No menu items found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new menu item</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <NavItemRow
              key={item.id}
              item={item}
              onEdit={(i) => { setEditingItem(i); setIsModalOpen(true); }}
              onDelete={handleDeleteItem}
              onToggle={handleToggleItem}
              allItems={items}
            />
          ))
        )}
      </div>

      <NavItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
        parentOptions={parentOptions}
      />
    </div>
  )
}
