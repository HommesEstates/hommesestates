'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { 
  X, Upload, Image as ImageIcon, Search, Folder, 
  Check, Trash2, Link as LinkIcon, Plus, Grid3X3, List
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ImagePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  selectedUrl?: string
}

const mockImages = [
  { id: '1', url: '/images/hero-1.jpg', name: 'hero-1.jpg', size: 2450000, folder: 'Hero' },
  { id: '2', url: '/images/hero-2.jpg', name: 'hero-2.jpg', size: 1890000, folder: 'Hero' },
  { id: '3', url: '/images/property-1.jpg', name: 'property-1.jpg', size: 3240000, folder: 'Properties' },
  { id: '4', url: '/images/property-2.jpg', name: 'property-2.jpg', size: 2780000, folder: 'Properties' },
  { id: '5', url: '/images/interior-1.jpg', name: 'interior-1.jpg', size: 1560000, folder: 'Interior' },
  { id: '6', url: '/images/exterior-1.jpg', name: 'exterior-1.jpg', size: 4120000, folder: 'Exterior' },
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function ImagePicker({ isOpen, onClose, onSelect, selectedUrl }: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(selectedUrl || null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState(mockImages)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    setUploading(true)
    
    try {
      // Simulate upload
      await new Promise(r => setTimeout(r, 1000))
      
      const newImages = acceptedFiles.map((file, i) => ({
        id: `new-${Date.now()}-${i}`,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        folder: 'Uploads'
      }))
      
      setImages([...newImages, ...images])
      toast.success(`Uploaded ${acceptedFiles.length} image(s)`)
    } catch (e) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] }
  })

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.folder.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const folders = [...new Set(images.map(img => img.folder))]

  const handleSelect = () => {
    if (selectedImage) {
      onSelect(selectedImage)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Image</h2>
            <p className="text-gray-500 text-sm">Choose an image from your library or upload new</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2.5 rounded-t-xl font-medium text-sm transition-colors ${
                activeTab === 'library' 
                  ? 'bg-accent text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Folder className="w-4 h-4 inline mr-2" />
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 rounded-t-xl font-medium text-sm transition-colors ${
                activeTab === 'upload' 
                  ? 'bg-accent text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload New
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'library' ? (
            <>
              {/* Sidebar - Folders */}
              <div className="w-56 border-r border-gray-200 p-4 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Folders</p>
                <div className="space-y-1">
                  <button className="w-full px-3 py-2 text-left rounded-lg bg-accent/10 text-accent font-medium text-sm">
                    All Images
                  </button>
                  {folders.map(folder => (
                    <button 
                      key={folder}
                      className="w-full px-3 py-2 text-left rounded-lg text-gray-600 hover:bg-gray-100 text-sm transition-colors"
                    >
                      <Folder className="w-4 h-4 inline mr-2 text-gray-400" />
                      {folder}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main - Image Grid */}
              <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search images..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Image Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {filteredImages.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No images found</p>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-4 gap-4">
                      {filteredImages.map((image) => (
                        <div
                          key={image.id}
                          onClick={() => setSelectedImage(image.url)}
                          className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedImage === image.url 
                              ? 'border-accent ring-2 ring-accent/20' 
                              : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img 
                            src={image.url} 
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedImage === image.url && (
                            <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs truncate">{image.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredImages.map((image) => (
                        <div
                          key={image.id}
                          onClick={() => setSelectedImage(image.url)}
                          className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border transition-all ${
                            selectedImage === image.url 
                              ? 'border-accent bg-accent/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            <img 
                              src={image.url} 
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{image.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(image.size)}</p>
                          </div>
                          {selectedImage === image.url && (
                            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 p-8">
              <div
                {...getRootProps()}
                className={`h-full rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragActive ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                  <Upload className="w-10 h-10 text-accent" />
                </div>
                <p className="text-xl font-medium text-gray-900 mb-2">
                  {uploading ? 'Uploading...' : isDragActive ? 'Drop images here' : 'Drag & drop images here'}
                </p>
                <p className="text-gray-500 mb-6">or click to browse from your computer</p>
                <p className="text-sm text-gray-400">Supports JPG, PNG, WebP up to 10MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedImage ? '1 image selected' : 'Select an image'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedImage}
              className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Image
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
