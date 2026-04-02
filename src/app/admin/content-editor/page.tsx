'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Plus, Eye, EyeOff, Trash2, GripVertical, Save, Monitor, 
  Smartphone, Tablet, Undo2, Redo2, Layers, Image as ImageIcon,
  Type, LayoutGrid, Sparkles, ArrowLeft, Check, Settings,
  ChevronDown, ChevronUp, Copy, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { SectionRenderer } from '@/components/content-editor/SectionRenderer'
import { SectionLibrary } from '@/components/content-editor/SectionLibrary'
import { SectionToolbar } from '@/components/content-editor/SectionToolbar'

export type SectionType = 
  | 'hero' 
  | 'text' 
  | 'features' 
  | 'gallery' 
  | 'cta' 
  | 'testimonials' 
  | 'properties'
  | 'partners'
  | 'services'
  | 'calculator'
  | 'analytics'
  | 'spotlight'
  | 'form'

export interface Section {
  id: string
  type: SectionType
  title?: string
  content: any
  styles?: any
  isVisible: boolean
  order: number
}

export interface PageData {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isHomepage: boolean
  metaTitle?: string
  metaDescription?: string
  sections: Section[]
}

const defaultSections: Record<SectionType, any> = {
  hero: {
    headline: 'Welcome to Hommes Estates',
    subheadline: 'Premium properties and luxury living in Nigeria',
    ctaText: 'Explore Properties',
    ctaLink: '/properties',
    backgroundImage: '',
    overlayOpacity: 0.4,
    textAlignment: 'center'
  },
  text: {
    title: 'About Us',
    content: '<p>Write your content here...</p>',
    alignment: 'left',
    maxWidth: '800px'
  },
  features: {
    title: 'Why Choose Us',
    features: [
      { icon: 'home', title: 'Premium Properties', description: 'Curated selection of luxury homes' },
      { icon: 'shield', title: 'Trusted Service', description: 'Professional real estate experts' },
      { icon: 'trending', title: 'Investment Growth', description: 'High-yield property investments' }
    ],
    layout: '3-col'
  },
  gallery: {
    title: 'Property Gallery',
    images: [],
    layout: 'grid'
  },
  cta: {
    title: 'Ready to Find Your Dream Home?',
    subtitle: 'Contact us today for a personalized consultation',
    buttonText: 'Get Started',
    buttonLink: '/contact',
    backgroundColor: '#1a1a1a'
  },
  testimonials: {
    title: 'What Our Clients Say',
    testimonials: []
  },
  properties: {
    title: 'Featured Properties',
    subtitle: 'Handpicked premium properties for you',
    limit: 6,
    filter: 'featured'
  },
  partners: {
    title: 'Our Partners',
    partners: []
  },
  services: {
    title: 'Our Services',
    services: [
      { icon: 'search', title: 'Property Search', description: 'Find your perfect property' },
      { icon: 'key', title: 'Property Management', description: 'Full-service management' },
      { icon: 'calculator', title: 'Investment Consulting', description: 'Expert investment advice' }
    ]
  },
  calculator: {
    title: 'Investment Calculator',
    subtitle: 'Calculate your potential returns'
  },
  analytics: {
    title: 'Market Analytics',
    subtitle: 'Real-time market insights'
  },
  spotlight: {
    title: 'Project Spotlight',
    subtitle: 'Featured development',
    project: null
  },
  form: {
    title: 'Contact Form',
    description: 'Fill out the form below and we will get back to you',
    submitButton: 'Send Message',
    successMessage: 'Thank you! We will be in touch soon.',
    fields: [
      { id: '1', type: 'text', label: 'Full Name', placeholder: 'John Smith', required: true },
      { id: '2', type: 'email', label: 'Email Address', placeholder: 'john@example.com', required: true },
      { id: '3', type: 'textarea', label: 'Message', placeholder: 'Your message...', required: true }
    ],
    layout: 'stacked'
  }
}

const mockPage: PageData = {
  id: 'home',
  title: 'Homepage',
  slug: '/',
  status: 'PUBLISHED',
  isHomepage: true,
  metaTitle: 'Hommes Estates - Premium Properties',
  metaDescription: 'Luxury real estate in Nigeria',
  sections: [
    { id: '1', type: 'hero', content: defaultSections.hero, isVisible: true, order: 0 },
    { id: '2', type: 'properties', content: defaultSections.properties, isVisible: true, order: 1 },
    { id: '3', type: 'features', content: defaultSections.features, isVisible: true, order: 2 },
    { id: '4', type: 'spotlight', content: defaultSections.spotlight, isVisible: true, order: 3 },
    { id: '5', type: 'testimonials', content: defaultSections.testimonials, isVisible: true, order: 4 },
    { id: '6', type: 'cta', content: defaultSections.cta, isVisible: true, order: 5 }
  ]
}

export default function ContentEditorPage() {
  const [page, setPage] = useState<PageData>(mockPage)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [history, setHistory] = useState<PageData[]>([mockPage])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'styles' | 'settings'>('content')

  // Add to history when page changes
  const addToHistory = useCallback((newPage: PageData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newPage)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setPage(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setPage(history[historyIndex + 1])
    }
  }

  const updatePage = (updates: Partial<PageData>) => {
    const newPage = { ...page, ...updates }
    setPage(newPage)
    addToHistory(newPage)
  }

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      type,
      content: { ...defaultSections[type] },
      isVisible: true,
      order: page.sections.length
    }
    const newSections = [...page.sections, newSection]
    updatePage({ sections: newSections })
    setSelectedSectionId(newSection.id)
    setIsLibraryOpen(false)
    toast.success(`${type} section added`)
  }

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    const newSections = page.sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    )
    updatePage({ sections: newSections })
  }

  const deleteSection = (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return
    const newSections = page.sections.filter(s => s.id !== sectionId)
    updatePage({ sections: newSections })
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null)
    }
    toast.success('Section deleted')
  }

  const duplicateSection = (sectionId: string) => {
    const section = page.sections.find(s => s.id === sectionId)
    if (!section) return
    const newSection: Section = {
      ...section,
      id: `section-${Date.now()}`,
      order: page.sections.length,
      title: `${section.title || section.type} (Copy)`
    }
    const newSections = [...page.sections, newSection]
    updatePage({ sections: newSections })
    toast.success('Section duplicated')
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = page.sections.findIndex(s => s.id === sectionId)
    if (direction === 'up' && index > 0) {
      const newSections = [...page.sections]
      ;[newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]]
      updatePage({ sections: newSections })
    } else if (direction === 'down' && index < page.sections.length - 1) {
      const newSections = [...page.sections]
      ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      updatePage({ sections: newSections })
    }
  }

  const savePage = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Page saved successfully')
    } catch (e) {
      toast.error('Failed to save page')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedSection = page.sections.find(s => s.id === selectedSectionId)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{page.title}</h1>
            <p className="text-sm text-gray-500">/{page.slug}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            page.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
            page.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {page.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 hover:bg-white rounded-md transition-colors disabled:opacity-30"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 hover:bg-white rounded-md transition-colors disabled:opacity-30"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Preview Mode */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPreviewMode('tablet')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'tablet' ? 'bg-white shadow-sm' : ''}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>

          <button 
            onClick={savePage}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Section List */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Sections
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <Reorder.Group axis="y" values={page.sections} onReorder={(newOrder) => updatePage({ sections: newOrder })}>
              {page.sections.map((section, index) => (
                <Reorder.Item key={section.id} value={section}>
                  <motion.div
                    layout
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`group p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSectionId === section.id 
                        ? 'border-accent bg-accent/5' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${!section.isVisible ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 capitalize">
                          {section.type[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 capitalize truncate">
                          {section.title || section.type}
                        </p>
                        <p className="text-xs text-gray-500">{section.type}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up') }}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down') }}
                          disabled={index === page.sections.length - 1}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); duplicateSection(section.id) }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteSection(section.id) }}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </aside>

        {/* Center - Preview Canvas */}
        <main className="flex-1 bg-gray-100 overflow-y-auto p-4">
          <div className={`w-full h-full transition-all duration-300 ${
            previewMode === 'desktop' ? '' :
            previewMode === 'tablet' ? 'max-w-3xl mx-auto' :
            'max-w-sm mx-auto'
          }`}>
            <div className="bg-white shadow-lg overflow-hidden min-h-[600px]">
              {page.sections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  isSelected={selectedSectionId === section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  previewMode={previewMode}
                  onUpdate={(updates) => updateSection(section.id, updates)}
                />
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties Panel */}
        <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {selectedSection ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <button 
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'content' ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Content
                  </button>
                  <button 
                    onClick={() => setActiveTab('styles')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'styles' ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Styles
                  </button>
                  <button 
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'settings' ? 'bg-accent text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Settings
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 capitalize">
                    {selectedSection.title || selectedSection.type}
                  </h2>
                  <button
                    onClick={() => updateSection(selectedSection.id, { isVisible: !selectedSection.isVisible })}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      selectedSection.isVisible ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      selectedSection.isVisible ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <SectionToolbar
                  section={selectedSection}
                  activeTab={activeTab}
                  onUpdate={(updates) => updateSection(selectedSection.id, updates)}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <LayoutGrid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a section to edit</p>
                <p className="text-sm text-gray-400 mt-1">Click on any section in the canvas or sidebar</p>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Section Library Modal */}
      <AnimatePresence>
        {isLibraryOpen && (
          <SectionLibrary 
            onClose={() => setIsLibraryOpen(false)}
            onSelect={addSection}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
