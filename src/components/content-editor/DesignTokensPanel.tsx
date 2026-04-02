'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Palette, Type, Layout, Monitor, Smartphone, Tablet,
  Maximize, ChevronDown, Check, RefreshCcw, Download, Upload
} from 'lucide-react'
import toast from 'react-hot-toast'

export interface DesignTokens {
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
    muted: string
    success: string
    warning: string
    error: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    baseSize: number
    scale: number
  }
  spacing: {
    unit: number
    scale: number[]
  }
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
    wide: number
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
    xl: number
  }
}

export const defaultTokens: DesignTokens = {
  colors: {
    primary: '#1a1a1a',
    secondary: '#333333',
    accent: '#c9a962',
    text: '#1a1a1a',
    background: '#ffffff',
    muted: '#f5f5f5',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseSize: 16,
    scale: 1.25, // Major third
  },
  spacing: {
    unit: 4,
    scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64],
  },
  breakpoints: {
    mobile: 375,
    tablet: 768,
    desktop: 1280,
    wide: 1920,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
}

const googleFonts = [
  'Inter',
  'Playfair Display',
  'Merriweather',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Nunito',
  'Crimson Text',
  'Libre Baskerville',
]

const predefinedPalettes = [
  { name: 'Classic', colors: { primary: '#1a1a1a', accent: '#c9a962', text: '#1a1a1a', background: '#ffffff', muted: '#f5f5f5' } },
  { name: 'Modern Blue', colors: { primary: '#1e40af', accent: '#3b82f6', text: '#1e293b', background: '#ffffff', muted: '#f1f5f9' } },
  { name: 'Warm Earth', colors: { primary: '#78350f', accent: '#d97706', text: '#451a03', background: '#fffbeb', muted: '#fef3c7' } },
  { name: 'Dark Mode', colors: { primary: '#000000', accent: '#c9a962', text: '#ffffff', background: '#1a1a1a', muted: '#262626' } },
  { name: 'Forest', colors: { primary: '#14532d', accent: '#22c55e', text: '#052e16', background: '#f0fdf4', muted: '#dcfce7' } },
  { name: 'Rose', colors: { primary: '#881337', accent: '#e11d48', text: '#4c0519', background: '#fff1f2', muted: '#ffe4e6' } },
]

interface DesignTokensPanelProps {
  tokens: DesignTokens
  onChange: (tokens: DesignTokens) => void
}

export function DesignTokensPanel({ tokens, onChange }: DesignTokensPanelProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'spacing' | 'layout'>('colors')
  const [showPreview, setShowPreview] = useState(true)

  const updateColor = (key: keyof DesignTokens['colors'], value: string) => {
    onChange({
      ...tokens,
      colors: { ...tokens.colors, [key]: value }
    })
  }

  const applyPalette = (palette: typeof predefinedPalettes[0]) => {
    onChange({
      ...tokens,
      colors: { ...tokens.colors, ...palette.colors }
    })
    toast.success(`Applied ${palette.name} palette`)
  }

  const exportTokens = () => {
    const dataStr = JSON.stringify(tokens, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'design-tokens.json'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Design tokens exported')
  }

  const resetToDefault = () => {
    if (confirm('Reset all design tokens to default?')) {
      onChange(defaultTokens)
      toast.success('Reset to defaults')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={exportTokens}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <button
          onClick={resetToDefault}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {(['colors', 'typography', 'spacing', 'layout'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? 'bg-white shadow-sm text-accent' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Preset Palettes */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Palettes</h4>
            <div className="grid grid-cols-2 gap-2">
              {predefinedPalettes.map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => applyPalette(palette)}
                  className="group p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-accent transition-colors text-left"
                >
                  <div className="flex gap-1 mb-2">
                    {Object.values(palette.colors).slice(0, 4).map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{palette.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Custom Colors</h4>
            
            {Object.entries(tokens.colors).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateColor(key as any, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateColor(key as any, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          {showPreview && (
            <div 
              className="p-6 rounded-xl border-2 border-dashed border-gray-200"
              style={{ backgroundColor: tokens.colors.background }}
            >
              <h5 
                className="text-lg font-bold mb-2"
                style={{ color: tokens.colors.primary }}
              >
                Heading Sample
              </h5>
              <p style={{ color: tokens.colors.text }}>
                Body text sample with <span style={{ color: tokens.colors.accent }}>accent color</span>.
              </p>
              <button
                className="mt-4 px-4 py-2 rounded-lg font-medium"
                style={{ 
                  backgroundColor: tokens.colors.accent, 
                  color: tokens.colors.background 
                }}
              >
                Button Sample
              </button>
            </div>
          )}
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Heading Font</label>
            <select
              value={tokens.typography.headingFont}
              onChange={(e) => onChange({
                ...tokens,
                typography: { ...tokens.typography, headingFont: e.target.value }
              })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              {googleFonts.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Body Font</label>
            <select
              value={tokens.typography.bodyFont}
              onChange={(e) => onChange({
                ...tokens,
                typography: { ...tokens.typography, bodyFont: e.target.value }
              })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              {googleFonts.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Base Font Size: {tokens.typography.baseSize}px
            </label>
            <input
              type="range"
              min={12}
              max={20}
              value={tokens.typography.baseSize}
              onChange={(e) => onChange({
                ...tokens,
                typography: { ...tokens.typography, baseSize: parseInt(e.target.value) }
              })}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type Scale</label>
            <select
              value={tokens.typography.scale}
              onChange={(e) => onChange({
                ...tokens,
                typography: { ...tokens.typography, scale: parseFloat(e.target.value) }
              })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value={1.067}>Minor Second (1.067)</option>
              <option value={1.125}>Major Second (1.125)</option>
              <option value={1.2}>Minor Third (1.2)</option>
              <option value={1.25}>Major Third (1.25)</option>
              <option value={1.333}>Perfect Fourth (1.333)</option>
              <option value={1.414}>Augmented Fourth (1.414)</option>
              <option value={1.5}>Perfect Fifth (1.5)</option>
            </select>
          </div>

          {/* Typography Preview */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: tokens.typography.headingFont }}
            >
              H1 Heading
            </h1>
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: tokens.typography.headingFont }}
            >
              H2 Heading
            </h2>
            <h3 
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: tokens.typography.headingFont }}
            >
              H3 Heading
            </h3>
            <p 
              className="text-base mb-2"
              style={{ fontFamily: tokens.typography.bodyFont, fontSize: tokens.typography.baseSize }}
            >
              Body text paragraph
            </p>
            <p 
              className="text-sm text-gray-600"
              style={{ fontFamily: tokens.typography.bodyFont }}
            >
              Small text / Caption
            </p>
          </div>
        </div>
      )}

      {/* Spacing Tab */}
      {activeTab === 'spacing' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Spacing Unit: {tokens.spacing.unit}px
            </label>
            <input
              type="range"
              min={2}
              max={8}
              step={2}
              value={tokens.spacing.unit}
              onChange={(e) => onChange({
                ...tokens,
                spacing: { ...tokens.spacing, unit: parseInt(e.target.value) }
              })}
              className="w-full accent-accent"
            />
            <p className="text-xs text-gray-500 mt-1">
              All spacing values are multiples of this unit
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Border Radius Scale</label>
            <div className="space-y-3">
              {Object.entries(tokens.borderRadius).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16 capitalize">{key}</span>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    value={value}
                    onChange={(e) => onChange({
                      ...tokens,
                      borderRadius: { ...tokens.borderRadius, [key]: parseInt(e.target.value) }
                    })}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-sm font-mono w-10 text-right">{value}px</span>
                  <div 
                    className="w-8 h-8 bg-accent/20"
                    style={{ borderRadius: value }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Spacing Preview */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            <p className="text-sm font-medium text-gray-700">Spacing Preview</p>
            {tokens.spacing.scale.slice(0, 6).map((multiplier) => (
              <div key={multiplier} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8">{multiplier}x</span>
                <div 
                  className="h-4 bg-accent rounded"
                  style={{ width: tokens.spacing.unit * multiplier }}
                />
                <span className="text-xs text-gray-400">{tokens.spacing.unit * multiplier}px</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layout Tab */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Breakpoints</h4>
            <div className="space-y-4">
              {Object.entries(tokens.breakpoints).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24">
                    {key === 'mobile' && <Smartphone className="w-4 h-4 text-gray-400" />}
                    {key === 'tablet' && <Tablet className="w-4 h-4 text-gray-400" />}
                    {key === 'desktop' && <Monitor className="w-4 h-4 text-gray-400" />}
                    {key === 'wide' && <Maximize className="w-4 h-4 text-gray-400" />}
                    <span className="text-sm text-gray-600 capitalize">{key}</span>
                  </div>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange({
                      ...tokens,
                      breakpoints: { ...tokens.breakpoints, [key]: parseInt(e.target.value) }
                    })}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    step={1}
                    min={320}
                    max={2560}
                  />
                  <span className="text-sm text-gray-500 w-12">px</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> These breakpoints control the responsive preview modes and can be used in your CSS for media queries.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
