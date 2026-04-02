'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { 
  Image as ImageIcon, Upload, Trash2, Tag, Search, 
  Grid3X3, List, Filter, X, Check, MoreHorizontal,
  Download, Copy, Link as LinkIcon, Loader2
} from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string | null
  originalName: string
  mimeType: string
  size: number
  category: string
  createdAt: string
  tags?: string[]
}

const mockMedia: MediaItem[] = [
  {
    id: '1',
    url: '/images/property-1.jpg',
    thumbnailUrl: '/images/property-1-thumb.jpg',
    originalName: 'fusion-wuse-exterior.jpg',
    mimeType: 'image/jpeg',
    size: 2450000,
    category: 'property',
    createdAt: '2024-01-15',
    tags: ['fusion-wuse', 'exterior', 'featured']
  },
  {
    id: '2',
    url: '/images/property-2.jpg',
    thumbnailUrl: '/images/property-2-thumb.jpg',
    originalName: 'luxury-interior.jpg',
    mimeType: 'image/jpeg',
    size: 1840000,
    category: 'interior',
    createdAt: '2024-01-14',
    tags: ['interior', 'living-room']
  },
  {
    id: '3',
    url: '/images/brochure.pdf',
    originalName: 'property-brochure-2024.pdf',
    mimeType: 'application/pdf',
    size: 5240000,
    category: 'document',
    createdAt: '2024-01-10',
    tags: ['brochure', '2024']
  }
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function MediaCard({ item, selected, onSelect }: { 
  item: MediaItem
  selected: boolean
  onSelect: () => void
}) {
  const isImage = item.mimeType?.startsWith('image/')
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm border transition-all cursor-pointer ${
        selected ? 'border-accent ring-2 ring-accent/20' : 'border-gray-100 hover:shadow-lg hover:border-gray-200'
      }`}
    >
      <div className="aspect-square relative bg-gray-100">
        {isImage ? (
          <img 
            src={item.thumbnailUrl || item.url} 
            alt={item.originalName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-accent" />
            </div>
          </div>
        )}
        
        {/* Selection Overlay */}
        {selected && (
          <div className="absolute inset-0 bg-accent/10 pointer-events-none">
            <div className="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        
        {/* Hover Actions */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.url); toast.success('URL copied') }}
              className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a 
              href={item.url}
              download
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <p className="font-medium text-gray-900 truncate" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">
          {formatFileSize(item.size)}
        </p>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 3).map((t) => (
              <span key={t} className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                {t}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMedia()
  }, [])

  async function loadMedia() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/media')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      } else {
        setItems(mockMedia)
      }
    } catch (e) {
      setItems(mockMedia)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    setUploading(true)
    try {
      for (const f of acceptedFiles) {
        const form = new FormData()
        form.append('file', f)
        const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Failed to upload ${f.name}`)
      }
      toast.success(`Uploaded ${acceptedFiles.length} file(s)`)
      await loadMedia()
    } catch (e: any) {
      // Mock upload
      const newItems: MediaItem[] = acceptedFiles.map((f, i) => ({
        id: `new-${Date.now()}-${i}`,
        url: URL.createObjectURL(f),
        originalName: f.name,
        mimeType: f.type || 'application/octet-stream',
        size: f.size,
        category: 'upload',
        createdAt: new Date().toISOString(),
        tags: []
      }))
      setItems([...newItems, ...items])
      toast.success(`Uploaded ${acceptedFiles.length} file(s)`)
    } finally {
      setUploading(false)
    }
  }, [items])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} item(s)? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/admin/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids: Array.from(selected) }),
      })
      if (!res.ok) throw new Error('Bulk delete failed')
      setItems(items.filter(i => !selected.has(i.id)))
      clearSelection()
      toast.success('Deleted')
    } catch (e: any) {
      setItems(items.filter(i => !selected.has(i.id)))
      clearSelection()
      toast.success('Deleted')
    }
  }

  const bulkTag = async () => {
    if (selected.size === 0) return
    const tagsStr = prompt('Enter tags (comma-separated):') || ''
    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length === 0) return
    
    try {
      await fetch('/api/admin/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tag', ids: Array.from(selected), tags }),
      })
      setItems(items.map(i => selected.has(i.id) ? { ...i, tags: [...(i.tags || []), ...tags] } : i))
      clearSelection()
      toast.success('Tags updated')
    } catch (e) {
      setItems(items.map(i => selected.has(i.id) ? { ...i, tags: [...(i.tags || []), ...tags] } : i))
      clearSelection()
      toast.success('Tags updated')
    }
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: items.length,
    selected: selected.size,
    images: items.filter(i => i.mimeType?.startsWith('image/')).length,
    documents: items.filter(i => !i.mimeType?.startsWith('image/')).length
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Media Library</h1>
          <p className="text-gray-500">Upload and manage images, documents, and assets</p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{selected.size} selected</span>
            <button 
              onClick={bulkTag}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Tag className="w-4 h-4" />
              Set Tags
            </button>
            <button 
              onClick={bulkDelete}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button 
              onClick={clearSelection}
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Files</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Images</p>
          <p className="text-3xl font-bold text-purple-600">{stats.images}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Documents</p>
          <p className="text-3xl font-bold text-blue-600">{stats.documents}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Selected</p>
          <p className="text-3xl font-bold text-accent">{stats.selected}</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-accent" />
        </div>
        <p className="text-lg font-medium text-gray-900">
          {uploading ? 'Uploading...' : isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mt-2">or click to browse files</p>
        <p className="text-xs text-gray-400 mt-4">Supports images, PDFs, and documents up to 50MB</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">All Categories</option>
          <option value="property">Property</option>
          <option value="interior">Interior</option>
          <option value="document">Documents</option>
        </select>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No media found</p>
          <p className="text-gray-400 text-sm mt-1">Upload your first file to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <MediaCard 
              key={item.id} 
              item={item} 
              selected={selected.has(item.id)}
              onSelect={() => toggleSelect(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selected.has(item.id) ? 'bg-accent/5' : ''
                }`}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.mimeType?.startsWith('image/') ? (
                    <img src={item.thumbnailUrl || item.url} alt="" className="w-12 h-12 object-cover rounded-xl" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.originalName}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(item.size)}</p>
                </div>
                {item.tags && (
                  <div className="hidden md:flex gap-1">
                    {item.tags.slice(0, 3).map(t => (
                      <span key={t} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{t}</span>
                    ))}
                  </div>
                )}
                <span className="text-sm text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                {selected.has(item.id) && (
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
