'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Layout, Type, Image as ImageIcon, Sparkles, ArrowRight, 
  Building2, Quote, X, Check, ChevronRight, Star, Home,
  FileText
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  sections: any[]
  category: string
}

interface PageTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onApply: (sections: any[]) => void
}

const templates: Template[] = [
  {
    id: 'home-1',
    name: 'Homepage - Modern',
    description: 'Clean homepage with hero, properties, and testimonials',
    thumbnail: '/templates/home-1.jpg',
    category: 'Homepage',
    sections: [
      { type: 'hero', content: { headline: 'Welcome', subheadline: 'Discover premium properties' } },
      { type: 'properties', content: { title: 'Featured Properties', subtitle: 'Our best listings' } },
      { type: 'features', content: { title: 'Why Choose Us' } },
      { type: 'testimonials', content: { title: 'What Clients Say' } },
      { type: 'cta', content: { title: 'Ready to Get Started?' } }
    ]
  },
  {
    id: 'home-2',
    name: 'Homepage - Luxury',
    description: 'Elegant homepage with spotlight and services',
    thumbnail: '/templates/home-2.jpg',
    category: 'Homepage',
    sections: [
      { type: 'hero', content: { headline: 'Luxury Living', subheadline: 'Experience the extraordinary' } },
      { type: 'spotlight', content: { title: 'Featured Project' } },
      { type: 'services', content: { title: 'Our Services' } },
      { type: 'gallery', content: { title: 'Property Gallery' } },
      { type: 'cta', content: { title: 'Schedule a Viewing' } }
    ]
  },
  {
    id: 'about',
    name: 'About Page',
    description: 'Company story with team and values',
    thumbnail: '/templates/about.jpg',
    category: 'Content',
    sections: [
      { type: 'hero', content: { headline: 'About Us', subheadline: 'Our story and mission' } },
      { type: 'text', content: { title: 'Who We Are' } },
      { type: 'features', content: { title: 'Our Values' } },
      { type: 'gallery', content: { title: 'Our Office' } },
      { type: 'cta', content: { title: 'Join Our Team' } }
    ]
  },
  {
    id: 'properties',
    name: 'Properties Listing',
    description: 'Full property showcase page',
    thumbnail: '/templates/properties.jpg',
    category: 'Real Estate',
    sections: [
      { type: 'hero', content: { headline: 'Our Properties', subheadline: 'Find your dream home' } },
      { type: 'properties', content: { title: 'For Sale', filter: 'sale' } },
      { type: 'properties', content: { title: 'For Rent', filter: 'rent' } },
      { type: 'calculator', content: { title: 'Investment Calculator' } },
      { type: 'cta', content: { title: 'Contact an Agent' } }
    ]
  },
  {
    id: 'landing',
    name: 'Project Landing',
    description: 'Single project focus page with details',
    thumbnail: '/templates/landing.jpg',
    category: 'Real Estate',
    sections: [
      { type: 'hero', content: { headline: 'Fusion Wuse', subheadline: 'Premium apartments in Abuja' } },
      { type: 'gallery', content: { title: 'Gallery' } },
      { type: 'features', content: { title: 'Amenities' } },
      { type: 'spotlight', content: { title: 'Available Units' } },
      { type: 'cta', content: { title: 'Reserve Your Unit' } }
    ]
  },
  {
    id: 'contact',
    name: 'Contact Page',
    description: 'Contact form with map and info',
    thumbnail: '/templates/contact.jpg',
    category: 'Content',
    sections: [
      { type: 'hero', content: { headline: 'Contact Us', subheadline: 'We would love to hear from you' } },
      { type: 'text', content: { title: 'Get in Touch' } },
      { type: 'features', content: { title: 'Contact Info' } }
    ]
  },
  {
    id: 'services',
    name: 'Services Page',
    description: 'Showcase of all services offered',
    thumbnail: '/templates/services.jpg',
    category: 'Content',
    sections: [
      { type: 'hero', content: { headline: 'Our Services', subheadline: 'Comprehensive real estate solutions' } },
      { type: 'services', content: { title: 'What We Offer' } },
      { type: 'features', content: { title: 'Process' } },
      { type: 'testimonials', content: { title: 'Client Success Stories' } },
      { type: 'cta', content: { title: 'Book a Consultation' } }
    ]
  }
]

export function PageTemplates({ isOpen, onClose, onApply }: PageTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  if (!isOpen) return null

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))]

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const handleApply = () => {
    const template = templates.find(t => t.id === selectedTemplate)
    if (template) {
      onApply(template.sections)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex"
      >
        {/* Sidebar - Categories */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Templates</h2>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full px-4 py-2.5 rounded-xl text-left font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-accent text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Main - Templates Grid */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCategory === 'All' ? 'All Templates' : `${selectedCategory} Templates`}
              </h3>
              <p className="text-sm text-gray-500">
                {filteredTemplates.length} templates available
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedTemplate === template.id
                      ? 'border-accent ring-2 ring-accent/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] bg-gray-200 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layout className="w-12 h-12 text-gray-300" />
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                        {template.category}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 bg-white">
                    <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-500">{template.description}</p>
                    
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                      <Layout className="w-4 h-4" />
                      {template.sections.length} sections
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewTemplate(template)
                      }}
                      className="mt-4 w-full py-2 text-accent font-medium text-sm hover:bg-accent/5 rounded-lg transition-colors"
                    >
                      Preview Structure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selectedTemplate ? 'Template selected' : 'Select a template to apply'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedTemplate}
                className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply Template
              </button>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewTemplate.name}</h3>
                <p className="text-sm text-gray-500">Template Structure</p>
              </div>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                {previewTemplate.sections.map((section, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-lg font-semibold text-accent">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 capitalize">{section.type}</h4>
                      <p className="text-sm text-gray-500">
                        {section.content.title || section.content.headline || 'No title'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSelectedTemplate(previewTemplate.id)
                  setPreviewTemplate(null)
                }}
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
              >
                Use This Template
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
