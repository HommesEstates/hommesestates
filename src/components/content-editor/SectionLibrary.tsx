'use client'

import { motion } from 'framer-motion'
import { 
  X, Layout, Type, Image as ImageIcon, Grid3X3, 
  Quote, Star, Home, Building2, Sparkles, Calculator,
  BarChart3, Target, ArrowRight, Check, FormInput
} from 'lucide-react'
import { SectionType } from '@/app/admin/content-editor/page'

interface SectionLibraryProps {
  onClose: () => void
  onSelect: (type: SectionType) => void
}

const sectionCategories = [
  {
    name: 'Layout',
    sections: [
      { type: 'hero' as SectionType, name: 'Hero', description: 'Large banner with headline and CTA', icon: Layout },
      { type: 'text' as SectionType, name: 'Text Block', description: 'Rich text content area', icon: Type },
      { type: 'gallery' as SectionType, name: 'Gallery', description: 'Image grid or carousel', icon: Grid3X3 },
    ]
  },
  {
    name: 'Content',
    sections: [
      { type: 'features' as SectionType, name: 'Features', description: 'Feature grid with icons', icon: Sparkles },
      { type: 'services' as SectionType, name: 'Services', description: 'Services showcase', icon: Target },
      { type: 'testimonials' as SectionType, name: 'Testimonials', description: 'Client reviews slider', icon: Quote },
    ]
  },
  {
    name: 'Real Estate',
    sections: [
      { type: 'properties' as SectionType, name: 'Properties', description: 'Featured property listings', icon: Building2 },
      { type: 'spotlight' as SectionType, name: 'Project Spotlight', description: 'Highlight a development', icon: Star },
      { type: 'calculator' as SectionType, name: 'ROI Calculator', description: 'Investment calculator', icon: Calculator },
      { type: 'analytics' as SectionType, name: 'Analytics', description: 'Market data display', icon: BarChart3 },
    ]
  },
  {
    name: 'Conversion',
    sections: [
      { type: 'cta' as SectionType, name: 'Call to Action', description: 'Promotional banner with button', icon: ArrowRight },
      { type: 'form' as SectionType, name: 'Contact Form', description: 'Lead capture form builder', icon: FormInput },
      { type: 'partners' as SectionType, name: 'Partners', description: 'Logo carousel', icon: Home },
    ]
  }
]

export function SectionLibrary({ onClose, onSelect }: SectionLibraryProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Section</h2>
            <p className="text-gray-500">Choose a section type to add to your page</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh] p-6">
          <div className="space-y-8">
            {sectionCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  {category.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.sections.map((section) => (
                    <button
                      key={section.type}
                      onClick={() => onSelect(section.type)}
                      className="group p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-accent hover:bg-accent/5 transition-all text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-colors">
                          <section.icon className="w-6 h-6 text-gray-600 group-hover:text-accent" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-accent transition-colors">
                            {section.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
