'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Search, Save, Globe, FileText, Image as ImageIcon, 
  Link as LinkIcon, BarChart3, AlertCircle, CheckCircle2,
  Loader2, Plus, Trash2, ExternalLink, RefreshCw,
  Hash, Type, AlignLeft, Settings
} from 'lucide-react'
import { admin } from '@/lib/backend'

type PageType = 'home' | 'property' | 'listing' | 'content' | 'blog'

interface SEOPage {
  id: number
  url: string
  title: string
  meta_description: string
  meta_keywords: string[]
  og_title?: string
  og_description?: string
  og_image?: string
  canonical_url?: string
  robots_meta: string
  structured_data?: string
  type: PageType
  last_updated: string
}

interface SEOSettings {
  site_title: string
  site_description: string
  default_og_image: string
  google_analytics_id: string
  google_tag_manager_id: string
  facebook_pixel_id: string
  enable_structured_data: boolean
  enable_sitemap: boolean
  enable_robots_txt: boolean
}

const pageTypeConfig = {
  home: { label: 'Homepage', color: 'bg-blue-100 text-blue-700' },
  property: { label: 'Property', color: 'bg-green-100 text-green-700' },
  listing: { label: 'Listing', color: 'bg-purple-100 text-purple-700' },
  content: { label: 'Content', color: 'bg-amber-100 text-amber-700' },
  blog: { label: 'Blog', color: 'bg-pink-100 text-pink-700' }
}

function SEOPageCard({ page, onEdit, onDelete }: { 
  page: SEOPage; 
  onEdit: (p: SEOPage) => void;
  onDelete: (id: number) => void;
}) {
  const type = pageTypeConfig[page.type]

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
            <Globe className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 truncate max-w-[200px]">{page.url}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${type.color}`}>
              {type.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEdit(page)}
            className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(page.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Title</p>
          <p className="text-sm text-gray-700 line-clamp-2">{page.title || 'Not set'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Meta Description</p>
          <p className="text-sm text-gray-600 line-clamp-2">{page.meta_description || 'Not set'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Updated: {new Date(page.last_updated).toLocaleDateString()}
        </p>
        <Link 
          href={page.url}
          target="_blank"
          className="flex items-center gap-1 text-sm text-accent hover:text-accent-dark"
        >
          <ExternalLink className="w-4 h-4" />
          View Page
        </Link>
      </div>
    </motion.div>
  )
}

function SEOPageModal({ isOpen, onClose, onSave, page }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => void;
  page?: SEOPage | null;
}) {
  const [form, setForm] = useState({
    url: '',
    type: 'content' as PageType,
    title: '',
    meta_description: '',
    meta_keywords: '',
    og_title: '',
    og_description: '',
    canonical_url: '',
    robots_meta: 'index,follow'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (page) {
      setForm({
        url: page.url,
        type: page.type,
        title: page.title,
        meta_description: page.meta_description,
        meta_keywords: page.meta_keywords.join(', '),
        og_title: page.og_title || '',
        og_description: page.og_description || '',
        canonical_url: page.canonical_url || '',
        robots_meta: page.robots_meta
      })
    }
  }, [page])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave({
      ...form,
      meta_keywords: form.meta_keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{page ? 'Edit SEO' : 'Add Page SEO'}</h2>
          <p className="text-gray-500 text-sm mt-1">Configure SEO settings for this page</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Page URL *</label>
              <input 
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="/properties/fusion-wuse"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as PageType })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="home">Homepage</option>
                <option value="property">Property</option>
                <option value="listing">Listing</option>
                <option value="content">Content</option>
                <option value="blog">Blog</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Basic Meta Tags
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Page Title
                  <span className="text-xs text-gray-500 ml-2">({form.title.length}/60)</span>
                </label>
                <input 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  maxLength={60}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="e.g., Fusion Wuse - Luxury Apartments in Abuja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Meta Description
                  <span className="text-xs text-gray-500 ml-2">({form.meta_description.length}/160)</span>
                </label>
                <textarea 
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                  placeholder="Brief description of the page content"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Keywords</label>
                <input 
                  value={form.meta_keywords}
                  onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="luxury apartments, abuja real estate, property for sale"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Open Graph (Social Sharing)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">OG Title</label>
                <input 
                  value={form.og_title}
                  onChange={(e) => setForm({ ...form, og_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="Title for social sharing"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">OG Description</label>
                <textarea 
                  value={form.og_description}
                  onChange={(e) => setForm({ ...form, og_description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                  placeholder="Description for social sharing"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Canonical URL</label>
                <input 
                  value={form.canonical_url}
                  onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="https://yoursite.com/page-url"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Robots Meta</label>
                <select
                  value={form.robots_meta}
                  onChange={(e) => setForm({ ...form, robots_meta: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  <option value="index,follow">Index, Follow</option>
                  <option value="noindex,follow">No Index, Follow</option>
                  <option value="index,nofollow">Index, No Follow</option>
                  <option value="noindex,nofollow">No Index, No Follow</option>
                </select>
              </div>
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
              {loading ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function SEOPagePage() {
  const [pages, setPages] = useState<SEOPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<SEOPage | null>(null)

  useEffect(() => {
    loadPages()
  }, [])

  async function loadPages() {
    try {
      setLoading(true)
      const mockPages: SEOPage[] = [
        {
          id: 1,
          url: '/',
          title: 'Hommes Estates - Luxury Real Estate in Nigeria',
          meta_description: 'Discover premium properties and luxury real estate in Nigeria. Find your dream home with Hommes Estates.',
          meta_keywords: ['real estate', 'luxury properties', 'nigeria', 'abuja', 'lagos'],
          type: 'home',
          robots_meta: 'index,follow',
          last_updated: '2024-01-15'
        },
        {
          id: 2,
          url: '/properties/fusion-wuse',
          title: 'Fusion Wuse - Luxury Apartments | Hommes Estates',
          meta_description: 'Premium 2 and 3 bedroom apartments in the heart of Wuse, Abuja. Modern living at its finest.',
          meta_keywords: ['fusion wuse', 'abuja apartments', 'luxury living'],
          og_title: 'Fusion Wuse - Your Dream Home Awaits',
          og_description: 'Premium apartments in Abuja starting from ₦45M',
          type: 'property',
          robots_meta: 'index,follow',
          last_updated: '2024-01-10'
        },
        {
          id: 3,
          url: '/properties',
          title: 'Properties for Sale - Hommes Estates',
          meta_description: 'Browse our collection of luxury properties for sale in Nigeria.',
          meta_keywords: ['properties for sale', 'nigeria real estate', 'buy property'],
          type: 'listing',
          robots_meta: 'index,follow',
          last_updated: '2024-01-08'
        }
      ]
      setPages(mockPages)
    } catch (err) {
      setError('Failed to load SEO pages')
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePage(formData: any) {
    try {
      if (editingPage) {
        setPages(pages.map(p => p.id === editingPage.id ? { ...p, ...formData, last_updated: new Date().toISOString() } : p))
      } else {
        const newPage: SEOPage = {
          id: pages.length + 1,
          ...formData,
          last_updated: new Date().toISOString()
        }
        setPages([newPage, ...pages])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save SEO settings')
    }
  }

  async function handleDeletePage(id: number) {
    if (!confirm('Are you sure you want to delete these SEO settings?')) return
    setPages(pages.filter(p => p.id !== id))
  }

  const filteredPages = pages.filter(p => {
    const matchesSearch = 
      p.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.meta_description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || p.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: pages.length,
    withTitle: pages.filter(p => p.title).length,
    withDescription: pages.filter(p => p.meta_description).length,
    withOG: pages.filter(p => p.og_title).length
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SEO Management</h1>
          <p className="text-gray-500">Optimize your website for search engines</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingPage(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
          >
            <Plus className="w-5 h-5" />
            Add Page SEO
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Pages</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">With Title</p>
          <p className="text-3xl font-bold text-green-600">{stats.withTitle}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">With Description</p>
          <p className="text-3xl font-bold text-blue-600">{stats.withDescription}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">With OG Tags</p>
          <p className="text-3xl font-bold text-purple-600">{stats.withOG}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search pages..."
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
          <option value="home">Homepage</option>
          <option value="property">Property</option>
          <option value="listing">Listing</option>
          <option value="content">Content</option>
          <option value="blog">Blog</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Pages Grid */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No pages found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or add a new page</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map((page) => (
            <SEOPageCard 
              key={page.id} 
              page={page} 
              onEdit={(p) => { setEditingPage(p); setIsModalOpen(true); }}
              onDelete={handleDeletePage}
            />
          ))}
        </div>
      )}

      <SEOPageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePage}
        page={editingPage}
      />
    </div>
  )
}
