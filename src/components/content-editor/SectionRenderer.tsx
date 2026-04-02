'use client'

import { motion } from 'framer-motion'
import { Section, SectionType } from '@/app/admin/content-editor/page'
import { InlineEditor } from './InlineEditor'
import { 
  Edit3, Image as ImageIcon, Type, Sparkles, Layout,
  Building2, Quote, ArrowRight, Home, Calculator, BarChart3, Star,
  FormInput, Send, Check
} from 'lucide-react'
import { useState } from 'react'
import { FormSectionContent } from './FormBuilder'

interface SectionRendererProps {
  section: Section
  isSelected: boolean
  onClick: () => void
  previewMode: 'desktop' | 'tablet' | 'mobile'
  onUpdate?: (updates: Partial<Section>) => void
}

const sectionIcons: Record<SectionType, any> = {
  hero: Layout,
  text: Type,
  features: Sparkles,
  gallery: ImageIcon,
  cta: ArrowRight,
  testimonials: Quote,
  properties: Building2,
  partners: Home,
  services: Sparkles,
  calculator: Calculator,
  analytics: BarChart3,
  spotlight: Star,
  form: FormInput
}

function HeroSection({ content, onUpdate }: { content: any, onUpdate?: (c: any) => void }) {
  return (
    <div 
      className="relative min-h-[500px] flex items-center justify-center p-8"
      style={{
        backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${content.overlayOpacity || 0.4})` }}
      />
      <div className={`relative z-10 text-center ${content.textAlignment === 'left' ? 'text-left' : content.textAlignment === 'right' ? 'text-right' : 'text-center'}`}>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          {onUpdate ? (
            <InlineEditor
              content={content.headline || 'Hero Headline'}
              onChange={(v) => onUpdate({ ...content, headline: v })}
              className="text-white"
            />
          ) : (
            content.headline || 'Hero Headline'
          )}
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          {onUpdate ? (
            <InlineEditor
              content={content.subheadline || 'Subheadline text goes here'}
              onChange={(v) => onUpdate({ ...content, subheadline: v })}
              className="text-white/80"
            />
          ) : (
            content.subheadline || 'Subheadline text goes here'
          )}
        </p>
        {content.ctaText && (
          <button className="px-8 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-dark transition-colors">
            {content.ctaText}
          </button>
        )}
      </div>
    </div>
  )
}

function TextSection({ content, onUpdate }: { content: any, onUpdate?: (c: any) => void }) {
  return (
    <div className="py-16 px-8 max-w-4xl mx-auto">
      {content.title && (
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {onUpdate ? (
            <InlineEditor
              content={content.title}
              onChange={(v) => onUpdate({ ...content, title: v })}
            />
          ) : (
            content.title
          )}
        </h2>
      )}
      <div 
        className="prose prose-lg max-w-none"
        style={{ textAlign: content.alignment || 'left' }}
      >
        {onUpdate ? (
          <InlineEditor
            content={content.content || '<p>Text content...</p>'}
            onChange={(v) => onUpdate({ ...content, content: v })}
            multiline
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: content.content || '<p>Text content...</p>' }} />
        )}
      </div>
    </div>
  )
}

function FeaturesSection({ content, onUpdate }: { content: any, onUpdate?: (c: any) => void }) {
  const features = content.features || []
  const layout = content.layout || '3-col'
  
  return (
    <div className="py-16 px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {onUpdate ? (
              <InlineEditor
                content={content.title}
                onChange={(v) => onUpdate({ ...content, title: v })}
              />
            ) : (
              content.title
            )}
          </h2>
        )}
        <div className={`grid gap-8 ${
          layout === '2-col' ? 'md:grid-cols-2' : 
          layout === '3-col' ? 'md:grid-cols-3' : 
          layout === '4-col' ? 'md:grid-cols-4' :
          'md:grid-cols-3'
        }`}>
          {features.map((feature: any, idx: number) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {onUpdate ? (
                  <InlineEditor
                    content={feature.title}
                    onChange={(v) => {
                      const newFeatures = [...features]
                      newFeatures[idx].title = v
                      onUpdate({ ...content, features: newFeatures })
                    }}
                  />
                ) : (
                  feature.title
                )}
              </h3>
              <p className="text-gray-600">
                {onUpdate ? (
                  <InlineEditor
                    content={feature.description}
                    onChange={(v) => {
                      const newFeatures = [...features]
                      newFeatures[idx].description = v
                      onUpdate({ ...content, features: newFeatures })
                    }}
                  />
                ) : (
                  feature.description
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GallerySection({ content }: { content: any }) {
  const images = content.images || []
  
  return (
    <div className="py-16 px-8">
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">{content.title}</h2>
        )}
        {images.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No images added yet</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            content.layout === 'masonry' ? 'grid-cols-2 md:grid-cols-3' :
            content.layout === 'carousel' ? 'grid-cols-1' :
            'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {images.map((image: any, idx: number) => (
              <div key={idx} className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                <img 
                  src={image.url || image} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CtaSection({ content, onUpdate }: { content: any, onUpdate?: (c: any) => void }) {
  return (
    <div 
      className="py-20 px-8 text-center"
      style={{ backgroundColor: content.backgroundColor || '#1a1a1a' }}
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {onUpdate ? (
            <InlineEditor
              content={content.title || 'Call to Action'}
              onChange={(v) => onUpdate({ ...content, title: v })}
              className="text-white"
            />
          ) : (
            content.title || 'Call to Action'
          )}
        </h2>
        <p className="text-xl text-white/80 mb-8">
          {onUpdate ? (
            <InlineEditor
              content={content.subtitle || 'Subtitle text goes here'}
              onChange={(v) => onUpdate({ ...content, subtitle: v })}
              className="text-white/80"
            />
          ) : (
            content.subtitle || 'Subtitle text goes here'
          )}
        </p>
        {content.buttonText && (
          <button className="px-8 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-dark transition-colors">
            {content.buttonText}
          </button>
        )}
      </div>
    </div>
  )
}

function PropertiesSection({ content }: { content: any }) {
  return (
    <div className="py-16 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {content.title || 'Featured Properties'}
          </h2>
          <p className="text-gray-600">{content.subtitle || 'Handpicked premium properties'}</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">Property {i}</h3>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-accent font-semibold mt-2">₦45,000,000</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TestimonialsSection({ content }: { content: any }) {
  return (
    <div className="py-16 px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          {content.title || 'What Our Clients Say'}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div>
                  <h4 className="font-semibold text-gray-900">Client Name</h4>
                  <p className="text-sm text-gray-500">Position</p>
                </div>
              </div>
              <p className="text-gray-600 italic">
                &ldquo;Amazing experience working with Hommes Estates...&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ServicesSection({ content, onUpdate }: { content: any, onUpdate?: (c: any) => void }) {
  const services = content.services || []
  
  return (
    <div className="py-16 px-8">
      <div className="max-w-6xl mx-auto">
        {content.title && (
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {onUpdate ? (
              <InlineEditor
                content={content.title}
                onChange={(v) => onUpdate({ ...content, title: v })}
              />
            ) : (
              content.title
            )}
          </h2>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service: any, idx: number) => (
            <div key={idx} className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {onUpdate ? (
                  <InlineEditor
                    content={service.title}
                    onChange={(v) => {
                      const newServices = [...services]
                      newServices[idx].title = v
                      onUpdate({ ...content, services: newServices })
                    }}
                  />
                ) : (
                  service.title
                )}
              </h3>
              <p className="text-gray-600">
                {onUpdate ? (
                  <InlineEditor
                    content={service.description}
                    onChange={(v) => {
                      const newServices = [...services]
                      newServices[idx].description = v
                      onUpdate({ ...content, services: newServices })
                    }}
                  />
                ) : (
                  service.description
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FormSection({ content, onUpdate }: { content: any, onUpdate?: (c: any) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1000)
  }

  if (isSubmitted) {
    return (
      <div className="py-16 px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600">{content.successMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {onUpdate ? (
              <InlineEditor
                content={content.title}
                onChange={(v) => onUpdate({ ...content, title: v })}
              />
            ) : (
              content.title
            )}
          </h2>
          {content.description && (
            <p className="text-gray-600">
              {onUpdate ? (
                <InlineEditor
                  content={content.description}
                  onChange={(v) => onUpdate({ ...content, description: v })}
                />
              ) : (
                content.description
              )}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className={`grid gap-4 ${
          content.layout === '2-col' ? 'md:grid-cols-2' :
          content.layout === '3-col' ? 'md:grid-cols-3' :
          ''
        }`}>
          {content.fields?.map((field: any) => (
            <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-full' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {field.options?.map((opt: string, i: number) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    required={field.required}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-gray-700">{field.label}</span>
                </label>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              )}
            </div>
          ))}
          
          <div className={content.layout !== 'stacked' ? 'md:col-span-full' : ''}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {content.submitButton}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
function PlaceholderSection({ type }: { type: SectionType }) {
  const Icon = sectionIcons[type]
  
  return (
    <div className="py-16 px-8 bg-gray-50 border-y border-dashed border-gray-200">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 capitalize">{type} Section</h3>
        <p className="text-gray-500">Configure this section in the properties panel</p>
      </div>
    </div>
  )
}

export function SectionRenderer({ section, isSelected, onClick, onUpdate }: SectionRendererProps) {
  const handleUpdate = onUpdate ? (content: any) => {
    onUpdate({ content: { ...section.content, ...content } })
  } : undefined
  const renderSection = () => {
    switch (section.type) {
      case 'hero':
        return <HeroSection content={section.content} onUpdate={handleUpdate} />
      case 'text':
        return <TextSection content={section.content} onUpdate={handleUpdate} />
      case 'features':
        return <FeaturesSection content={section.content} onUpdate={handleUpdate} />
      case 'gallery':
        return <GallerySection content={section.content} />
      case 'cta':
        return <CtaSection content={section.content} onUpdate={handleUpdate} />
      case 'properties':
        return <PropertiesSection content={section.content} />
      case 'testimonials':
        return <TestimonialsSection content={section.content} />
      case 'services':
        return <ServicesSection content={section.content} onUpdate={handleUpdate} />
      case 'form':
        return <FormSection content={section.content} onUpdate={handleUpdate} />
      default:
        return <PlaceholderSection type={section.type} />
    }
  }

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`relative group cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-accent ring-inset' : ''
      } ${!section.isVisible ? 'opacity-50' : ''}`}
    >
      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 ring-2 ring-accent ring-inset pointer-events-none z-20" />
      )}
      
      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 ${
        isSelected ? 'opacity-0' : ''
      }`} />
      
      {/* Section Label */}
      <div className={`absolute top-4 left-4 z-30 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity ${
        isSelected ? 'bg-accent text-white opacity-100' : 'bg-gray-900 text-white opacity-0 group-hover:opacity-100'
      }`}>
        {section.title || section.type}
        {isSelected && <span className="ml-2 text-accent-light">• Click text to edit</span>}
      </div>

      {/* Section Content */}
      <div className="relative">
        {renderSection()}
      </div>
    </motion.div>
  )
}
