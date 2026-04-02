'use client'

import { useState } from 'react'
import { Section } from '@/app/admin/content-editor/page'
import { 
  Type, Image as ImageIcon, Palette, Settings, 
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Palette as PaletteIcon, Sparkles
} from 'lucide-react'
import { FormBuilder, FormSectionContent } from './FormBuilder'
import { DesignTokensPanel, DesignTokens, defaultTokens } from './DesignTokensPanel'

interface SectionToolbarProps {
  section: Section
  activeTab: 'content' | 'styles' | 'settings'
  onUpdate: (updates: Partial<Section>) => void
  globalTokens?: DesignTokens
  onTokensChange?: (tokens: DesignTokens) => void
}

export function SectionToolbar({ section, activeTab, onUpdate }: SectionToolbarProps) {
  const [newFeature, setNewFeature] = useState({ title: '', description: '' })
  const [newImage, setNewImage] = useState('')

  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...section.content, [key]: value }
    })
  }

  const renderContentTab = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Headline</label>
              <input
                type="text"
                value={section.content.headline || ''}
                onChange={(e) => updateContent('headline', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder="Enter headline"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subheadline</label>
              <textarea
                value={section.content.subheadline || ''}
                onChange={(e) => updateContent('subheadline', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                placeholder="Enter subheadline"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Text</label>
                <input
                  type="text"
                  value={section.content.ctaText || ''}
                  onChange={(e) => updateContent('ctaText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="Get Started"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Link</label>
                <input
                  type="text"
                  value={section.content.ctaLink || ''}
                  onChange={(e) => updateContent('ctaLink', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="/contact"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={section.content.backgroundImage || ''}
                  onChange={(e) => updateContent('backgroundImage', e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  placeholder="https://..."
                />
                <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder="Section title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Content (HTML)</label>
              <textarea
                value={section.content.content || ''}
                onChange={(e) => updateContent('content', e.target.value)}
                rows={8}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono text-sm"
                placeholder="<p>Your content here...</p>"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Text Alignment</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => updateContent('alignment', align)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      section.content.alignment === align
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'features':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Layout</label>
              <select
                value={section.content.layout || '3-col'}
                onChange={(e) => updateContent('layout', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="2-col">2 Columns</option>
                <option value="3-col">3 Columns</option>
                <option value="4-col">4 Columns</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
              <div className="space-y-2">
                {(section.content.features || []).map((feature: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Feature {idx + 1}</span>
                      <button
                        onClick={() => {
                          const newFeatures = [...section.content.features]
                          newFeatures.splice(idx, 1)
                          updateContent('features', newFeatures)
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => {
                        const newFeatures = [...section.content.features]
                        newFeatures[idx].title = e.target.value
                        updateContent('features', newFeatures)
                      }}
                      className="w-full px-3 py-2 mb-2 bg-white border border-gray-200 rounded-lg text-sm"
                      placeholder="Feature title"
                    />
                    <input
                      type="text"
                      value={feature.description}
                      onChange={(e) => {
                        const newFeatures = [...section.content.features]
                        newFeatures[idx].description = e.target.value
                        updateContent('features', newFeatures)
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                      placeholder="Feature description"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Add New Feature</p>
                <input
                  type="text"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                  className="w-full px-3 py-2 mb-2 bg-white border border-gray-200 rounded-lg text-sm"
                  placeholder="Feature title"
                />
                <input
                  type="text"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  className="w-full px-3 py-2 mb-2 bg-white border border-gray-200 rounded-lg text-sm"
                  placeholder="Feature description"
                />
                <button
                  onClick={() => {
                    if (newFeature.title) {
                      updateContent('features', [
                        ...(section.content.features || []),
                        { ...newFeature, icon: 'sparkles' }
                      ])
                      setNewFeature({ title: '', description: '' })
                    }
                  }}
                  className="w-full px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Feature
                </button>
              </div>
            </div>
          </div>
        )

      case 'gallery':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gallery Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Layout</label>
              <select
                value={section.content.layout || 'grid'}
                onChange={(e) => updateContent('layout', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="grid">Grid</option>
                <option value="masonry">Masonry</option>
                <option value="carousel">Carousel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Images</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(section.content.images || []).map((img: string, idx: number) => (
                  <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        const newImages = [...section.content.images]
                        newImages.splice(idx, 1)
                        updateContent('images', newImages)
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm"
                  placeholder="Image URL"
                />
                <button
                  onClick={() => {
                    if (newImage) {
                      updateContent('images', [...(section.content.images || []), newImage])
                      setNewImage('')
                    }
                  }}
                  className="px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
              <input
                type="text"
                value={section.content.subtitle || ''}
                onChange={(e) => updateContent('subtitle', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Button Text</label>
                <input
                  type="text"
                  value={section.content.buttonText || ''}
                  onChange={(e) => updateContent('buttonText', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Button Link</label>
                <input
                  type="text"
                  value={section.content.buttonLink || ''}
                  onChange={(e) => updateContent('buttonLink', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Color</label>
              <div className="flex gap-2 flex-wrap">
                {['#1a1a1a', '#333333', '#2563eb', '#059669', '#dc2626', '#7c3aed'].map((color) => (
                  <button
                    key={color}
                    onClick={() => updateContent('backgroundColor', color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      section.content.backgroundColor === color ? 'border-accent scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case 'properties':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
              <input
                type="text"
                value={section.content.subtitle || ''}
                onChange={(e) => updateContent('subtitle', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Properties</label>
              <input
                type="number"
                value={section.content.limit || 6}
                onChange={(e) => updateContent('limit', parseInt(e.target.value))}
                min={1}
                max={12}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Filter</label>
              <select
                value={section.content.filter || 'featured'}
                onChange={(e) => updateContent('filter', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                <option value="featured">Featured</option>
                <option value="recent">Recent</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
          </div>
        )

      case 'testimonials':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <p className="text-sm text-gray-500">
              Testimonials are managed in the Testimonials section of the admin panel.
            </p>
          </div>
        )

      case 'services':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Title</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <p className="text-sm text-gray-500">
              Services are managed in the content configuration.
            </p>
          </div>
        )

      case 'form':
        return (
          <FormBuilder
            content={section.content}
            onChange={(newContent) => updateContent('', newContent)}
          />
        )

      default:
        return (
          <div className="p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-gray-500">Content editor for {section.type} coming soon</p>
          </div>
        )
    }
  }

  const renderStylesTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Padding</label>
        <select
          value={section.styles?.padding || 'large'}
          onChange={(e) => onUpdate({ styles: { ...section.styles, padding: e.target.value } })}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="none">None</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Background</label>
        <select
          value={section.styles?.background || 'white'}
          onChange={(e) => onUpdate({ styles: { ...section.styles, background: e.target.value } })}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="white">White</option>
          <option value="gray">Light Gray</option>
          <option value="dark">Dark</option>
          <option value="accent">Accent</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom CSS Class</label>
        <input
          type="text"
          value={section.styles?.className || ''}
          onChange={(e) => onUpdate({ styles: { ...section.styles, className: e.target.value } })}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          placeholder="e.g., my-custom-class"
        />
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Section ID</label>
        <input
          type="text"
          value={section.id}
          disabled
          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">Used for anchor links</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Name</label>
        <input
          type="text"
          value={section.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          placeholder="Internal name for this section"
        />
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <label className="text-sm font-medium text-gray-700">Visible on Page</label>
          <p className="text-xs text-gray-500">Hide this section without deleting it</p>
        </div>
        <button
          onClick={() => onUpdate({ isVisible: !section.isVisible })}
          className={`w-12 h-6 rounded-full transition-colors ${section.isVisible ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${section.isVisible ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {activeTab === 'content' && renderContentTab()}
      {activeTab === 'styles' && renderStylesTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </div>
  )
}
