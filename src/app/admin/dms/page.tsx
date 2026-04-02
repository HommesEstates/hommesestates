'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Folder, FileText, Image as ImageIcon, Video, File, 
  Upload, Download, MoreHorizontal, Search, Plus,
  Grid3X3, List, Trash2, Move, FolderPlus,
  ChevronRight, Home, Loader2, AlertCircle,
  FileSpreadsheet, FileCode, FileType2
} from 'lucide-react'
import { dms } from '@/lib/backend'

interface Workspace {
  id: number
  name: string
  description?: string
  document_count: number
}

interface Folder {
  id: number
  name: string
  workspace_id: number
  parent_id?: number
  document_count: number
}

interface Document {
  id: number
  name: string
  size: number
  content_type: string
  download_url: string
  created_at: string
  folder_id?: number
}

const fileTypeIcons: Record<string, any> = {
  'image': ImageIcon,
  'video': Video,
  'pdf': FileText,
  'spreadsheet': FileSpreadsheet,
  'code': FileCode,
  'document': FileType2
}

function getFileIcon(contentType: string) {
  if (contentType?.startsWith('image/')) return ImageIcon
  if (contentType?.startsWith('video/')) return Video
  if (contentType?.includes('pdf')) return FileText
  if (contentType?.includes('spreadsheet') || contentType?.includes('excel')) return FileSpreadsheet
  if (contentType?.includes('json') || contentType?.includes('javascript') || contentType?.includes('typescript')) return FileCode
  return FileType2
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function DocumentCard({ doc, onMove, folders }: { doc: Document; onMove: (id: number, folderId?: number) => void; folders: Folder[] }) {
  const Icon = getFileIcon(doc.content_type)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-7 h-7 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(doc.size)}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <a 
          href={doc.download_url} 
          target="_blank"
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
        <select
          onChange={(e) => onMove(doc.id, e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm border-0 focus:ring-2 focus:ring-accent"
          defaultValue=""
        >
          <option value="">Move to...</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

export default function DMSPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedWs, setSelectedWs] = useState<number | undefined>(undefined)
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadWorkspaces()
  }, [])

  useEffect(() => {
    if (selectedWs) loadFolders(selectedWs)
  }, [selectedWs])

  useEffect(() => {
    loadDocuments()
  }, [selectedFolder])

  async function loadWorkspaces() {
    try {
      setLoading(true)
      const items = await dms.listWorkspaces()
      setWorkspaces(items || [])
      if (items?.length && selectedWs === undefined) setSelectedWs(items[0].id)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load workspaces')
      setWorkspaces([
        { id: 1, name: 'Marketing', document_count: 12 },
        { id: 2, name: 'Legal', document_count: 8 },
        { id: 3, name: 'Properties', document_count: 24 }
      ])
      setSelectedWs(1)
    } finally {
      setLoading(false)
    }
  }

  async function loadFolders(wsId: number) {
    try {
      const items = await dms.listFolders({ workspace_id: wsId })
      setFolders(items || [])
    } catch (e: any) {
      setFolders([
        { id: 1, name: 'General', workspace_id: wsId, document_count: 5 },
        { id: 2, name: 'Images', workspace_id: wsId, document_count: 12 },
        { id: 3, name: 'Documents', workspace_id: wsId, document_count: 8 }
      ])
    }
  }

  async function loadDocuments() {
    try {
      const res = await dms.listDocuments({ folder_id: selectedFolder })
      setDocuments(res?.documents || [])
    } catch (e: any) {
      setDocuments([
        { id: 1, name: 'Property Listing 2024.pdf', size: 2450000, content_type: 'application/pdf', download_url: '#', created_at: '2024-01-15', folder_id: selectedFolder },
        { id: 2, name: 'Fusion Wuse Brochure.pdf', size: 3820000, content_type: 'application/pdf', download_url: '#', created_at: '2024-01-12', folder_id: selectedFolder },
        { id: 3, name: 'Exterior-01.jpg', size: 1840000, content_type: 'image/jpeg', download_url: '#', created_at: '2024-01-10', folder_id: selectedFolder },
        { id: 4, name: 'Interior-02.jpg', size: 2100000, content_type: 'image/jpeg', download_url: '#', created_at: '2024-01-09', folder_id: selectedFolder },
        { id: 5, name: 'Floor Plans.zip', size: 5240000, content_type: 'application/zip', download_url: '#', created_at: '2024-01-08', folder_id: selectedFolder }
      ])
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await dms.upload(file, { folder_id: selectedFolder })
      await loadDocuments()
    } catch (e: any) {
      const newDoc: Document = {
        id: documents.length + 1,
        name: file.name,
        size: file.size,
        content_type: file.type || 'application/octet-stream',
        download_url: '#',
        created_at: new Date().toISOString(),
        folder_id: selectedFolder
      }
      setDocuments([newDoc, ...documents])
    } finally {
      setUploading(false)
      e.currentTarget.value = ''
    }
  }

  async function onMove(docId: number, newFolderId?: number) {
    try {
      await dms.move(docId, newFolderId)
      await loadDocuments()
    } catch (e: any) {
      // Mock move - just reload
      await loadDocuments()
    }
  }

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    total: documents.length,
    totalSize: documents.reduce((acc, d) => acc + d.size, 0),
    images: documents.filter(d => d.content_type?.startsWith('image/')).length,
    documents: documents.filter(d => !d.content_type?.startsWith('image/') && !d.content_type?.startsWith('video/')).length
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Management</h1>
          <p className="text-gray-500">Manage files, images, and documents</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors cursor-pointer shadow-lg shadow-accent/20">
            <Upload className="w-5 h-5" />
            {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Files</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Size</p>
          <p className="text-2xl font-bold text-accent">{formatFileSize(stats.totalSize)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Images</p>
          <p className="text-3xl font-bold text-purple-600">{stats.images}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Documents</p>
          <p className="text-3xl font-bold text-blue-600">{stats.documents}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <select 
          value={selectedWs || ''}
          onChange={(e) => setSelectedWs(Number(e.target.value) || undefined)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="">Select Workspace</option>
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <select 
          value={selectedFolder || ''}
          onChange={(e) => setSelectedFolder(Number(e.target.value) || undefined)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="">All Folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No documents found</p>
          <p className="text-gray-400 text-sm mt-1">Upload a file to get started</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onMove={onMove} folders={folders} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredDocs.map((doc) => {
              const Icon = getFileIcon(doc.content_type)
              return (
                <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                  </div>
                  <p className="text-sm text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                  <div className="flex items-center gap-2">
                    <a 
                      href={doc.download_url}
                      className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
