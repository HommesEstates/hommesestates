'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut, Eye, EyeOff, Download } from 'lucide-react'

interface PropertyViewer3DProps {
  modelUrl?: string
  propertyName: string
  propertyId: string
  images?: string[]
  enableVirtualStaging?: boolean
  tourUrl?: string
}

export function PropertyViewer3D({ 
  modelUrl,
  propertyName,
  propertyId,
  images = [],
  enableVirtualStaging = false,
  tourUrl
}: PropertyViewer3DProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isStaged, setIsStaged] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [viewMode, setViewMode] = useState<'3d' | 'gallery' | 'tour'>(tourUrl ? 'tour' : 'gallery')
  const containerRef = useRef<HTMLDivElement>(null)
  const modelViewerRef = useRef<any>(null)

  // Production: Load model-viewer script dynamically
  useEffect(() => {
    if (viewMode === '3d' && !document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
      document.head.appendChild(script)
      
      script.onload = () => {
        setIsModelLoaded(true)
      }
    }
  }, [viewMode])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleDownloadFloorPlan = () => {
    // Production: Trigger PDF download from Odoo
    window.open(`/api/properties/${propertyId}/floor-plan.pdf`, '_blank')
  }

  // Fallback images if no 3D model
  const stagedImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200',
  ]

  const emptyImages = stagedImages.map(url => 
    url.replace('photo-', 'photo-empty-')
  )

  const currentImages = isStaged ? stagedImages : emptyImages

  return (
    <div 
      ref={containerRef}
      className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl overflow-hidden"
    >
      {/* Header Controls */}
      <div className="p-4 bg-surface border-b border-border flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-heading font-semibold text-lg">{propertyName}</h3>
          <p className="text-sm text-text/60">Interactive Viewer</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'gallery'
                  ? 'bg-white dark:bg-charcoal shadow-sm text-accent'
                  : 'text-text/60'
              }`}
            >
              Gallery
            </button>
            {tourUrl && (
              <button
                onClick={() => setViewMode('tour')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'tour'
                    ? 'bg-white dark:bg-charcoal shadow-sm text-accent'
                    : 'text-text/60'
                }`}
              >
                Tour
              </button>
            )}
            <button
              onClick={() => setViewMode('3d')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-white dark:bg-charcoal shadow-sm text-accent'
                  : 'text-text/60'
              }`}
            >
              3D Model
            </button>
          </div>

          {/* Virtual Staging Toggle */}
          {enableVirtualStaging && viewMode === 'gallery' && (
            <button
              onClick={() => setIsStaged(!isStaged)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:shadow-lg transition-all"
            >
              {isStaged ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isStaged ? 'Staged' : 'Empty'}
              </span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Viewer Area */}
      <div className="relative bg-muted/30">
        {viewMode === 'gallery' ? (
          /* Image Gallery View */
          <div className="relative">
            <motion.img
              key={currentImageIndex}
              src={currentImages[currentImageIndex]}
              alt={`${propertyName} - View ${currentImageIndex + 1}`}
              className="w-full h-[600px] object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Image Navigation */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              {currentImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentImageIndex
                      ? 'bg-accent w-8'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            {/* Arrow Navigation */}
            {currentImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex - 1 + currentImages.length) % currentImages.length)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 dark:bg-charcoal/90 rounded-full hover:bg-white dark:hover:bg-charcoal transition-all shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentImageIndex((currentImageIndex + 1) % currentImages.length)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/90 dark:bg-charcoal/90 rounded-full hover:bg-white dark:hover:bg-charcoal transition-all shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Staging Comparison Slider */}
            {enableVirtualStaging && (
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-charcoal/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <p className="text-xs font-medium text-text/70 mb-2">Virtual Staging</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text/60">Empty</span>
                  <label className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={isStaged}
                      onChange={() => setIsStaged(!isStaged)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                  <span className="text-xs text-text/60">Staged</span>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'tour' && tourUrl ? (
          /* Virtual Tour View */
          <div className="relative">
            <div className="w-full h-[600px]">
              <iframe
                src={tourUrl}
                className="w-full h-full rounded-none"
                allow="xr-spatial-tracking; gyroscope; accelerometer; vr; fullscreen"
                allowFullScreen
                loading="lazy"
                title={`${propertyName} Virtual Tour`}
              />
            </div>
          </div>
        ) : (
          /* 3D Model View */
          <div className="relative h-[600px] bg-gradient-to-br from-muted to-surface flex items-center justify-center">
            {isModelLoaded && modelUrl ? (
              <model-viewer
                ref={modelViewerRef}
                src={modelUrl}
                alt={`3D model of ${propertyName}`}
                auto-rotate
                camera-controls
                shadow-intensity="1"
                exposure="1"
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              >
                {/* Loading Indicator */}
                <div slot="poster" className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
                    <p className="text-text/70">Loading 3D Model...</p>
                  </div>
                </div>

                {/* AR Button (iOS/Android) */}
                <button
                  slot="ar-button"
                  className="absolute bottom-4 left-4 px-6 py-3 bg-copper-gradient text-white rounded-lg font-accent font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  View in AR
                </button>
              </model-viewer>
            ) : (
              /* Fallback if no 3D model */
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCw className="w-12 h-12 text-accent" />
                </div>
                <h4 className="text-xl font-heading font-semibold mb-2">3D Model Coming Soon</h4>
                <p className="text-text/60 mb-6">
                  We're preparing an interactive 3D model for this property.
                </p>
                <button
                  onClick={() => setViewMode('gallery')}
                  className="px-6 py-3 bg-accent text-white rounded-lg font-accent font-semibold hover:shadow-lg transition-all"
                >
                  View Photo Gallery
                </button>
              </div>
            )}

            {/* 3D Controls Overlay */}
            {isModelLoaded && modelUrl && (
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-charcoal/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <p className="text-xs font-medium text-text/70 mb-3">3D Controls</p>
                <div className="space-y-2 text-xs text-text/60">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4" />
                    <span>Drag to rotate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    <span>Scroll to zoom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    <span>Two-finger to pan</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-surface border-t border-border flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadFloorPlan}
            className="flex items-center gap-2 px-4 py-2 text-accent hover:bg-accent/10 rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download Floor Plan</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text/60">
            {viewMode === 'gallery' 
              ? `${currentImageIndex + 1} / ${currentImages.length}` 
              : '360° Interactive View'
            }
          </span>
        </div>
      </div>

      {/* Virtual Staging Info Banner */}
      {enableVirtualStaging && viewMode === 'gallery' && (
        <div className="p-3 bg-accent/10 border-t border-accent/20 text-center">
          <p className="text-sm text-text/70">
            <strong className="text-accent">Virtual Staging:</strong> Toggle between furnished and unfurnished views to visualize your space
          </p>
        </div>
      )}
    </div>
  )
}

// TypeScript declaration for model-viewer custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
}
