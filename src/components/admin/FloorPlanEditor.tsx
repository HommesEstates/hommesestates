'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Grid3X3,
  Save,
  Upload,
  Plus,
  Trash2,
  RotateCw,
  Move,
  LayoutGrid,
  Wand2,
  Download,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Box,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Check
} from 'lucide-react'
import { publicApi } from '@/lib/backend'

// --- Types ---
type SuiteShape = 'rectangle' | 'l-shape' | 'u-shape' | 'corner' | 'custom'
type ToolType = 'select' | 'pan' | 'rectangle' | 'l-shape' | 'u-shape' | 'corner'

interface SuitePlacement {
  id: string
  suiteId?: number
  suiteNumber?: string
  suiteName?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  shape: SuiteShape
  color: string
  label: string
  status: 'available' | 'reserved' | 'sold'
  area?: number
  price?: number
  floorId: number
  blockId?: number
  propertyId?: number
  // Shape-specific points for custom/L/U shapes
  points?: { x: number; y: number }[]
}

interface FloorPlanEditorProps {
  propertyId?: number
  blockId?: number
  floorId?: number
  floorName?: string
  onSave?: (placements: SuitePlacement[]) => void
  onClose?: () => void
}

interface UnassignedSuite {
  id: number
  name: string
  suiteNumber: string
  area: number
  price: number
  status: 'available' | 'reserved' | 'sold'
}

// --- Constants ---
const GRID_SIZE = 20
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800
const COLORS = {
  available: '#f97316', // orange-500
  reserved: '#9ca3af', // gray-400
  sold: '#d1d5db', // gray-300
  selected: '#3b82f6', // blue-500
}

const SHAPE_TEMPLATES = {
  rectangle: { width: 120, height: 120 },
  'l-shape': { width: 160, height: 160 },
  'u-shape': { width: 180, height: 140 },
  corner: { width: 140, height: 140 },
}

// --- Helper Components ---

function ToolbarButton({
  active,
  onClick,
  icon: Icon,
  label,
  tooltip,
}: {
  active?: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  tooltip?: string
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip || label}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-accent text-white shadow-lg shadow-accent/30'
          : 'bg-white dark:bg-white/5 text-text dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-border dark:border-white/10'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function PropertyInput({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
  step,
  suffix,
}: {
  label: string
  value: number | string
  onChange: (val: number | string) => void
  type?: 'text' | 'number'
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-[0.15em] text-text/50 dark:text-white/50 font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          min={min}
          max={max}
          step={step}
          className="w-full bg-white dark:bg-black/20 border border-border dark:border-white/10 rounded-lg px-3 py-2 text-sm text-text dark:text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text/40 dark:text-white/40">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

// --- Main Component ---

export function FloorPlanEditor({
  propertyId,
  blockId,
  floorId,
  floorName = 'Floor Plan',
  onSave,
  onClose,
}: FloorPlanEditorProps) {
  // State
  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [placements, setPlacements] = useState<SuitePlacement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [unassignedSuites, setUnassignedSuites] = useState<UnassignedSuite[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showUnassigned, setShowUnassigned] = useState(true)
  const [zoom, setZoom] = useState(1)

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load suites for this floor
  useEffect(() => {
    async function loadSuites() {
      if (!floorId) return
      
      setIsLoading(true)
      try {
        // Fetch suites for this floor
        const suites = await publicApi.listPropertySuites(propertyId || 0)
        const floorSuites = suites.filter((s: any) => 
          s.floor_id === floorId || s.floor === floorName
        )
        
        // Convert to unassigned suites
        const unassigned: UnassignedSuite[] = floorSuites.map((s: any) => ({
          id: s.id,
          name: s.name,
          suiteNumber: s.suite_number || s.number || `Suite ${s.id}`,
          area: s.size_sqm || s.area || 0,
          price: s.price || s.list_price || 0,
          status: s.status || (s.is_available ? 'available' : 'sold'),
        }))
        
        setUnassignedSuites(unassigned)
      } catch (error) {
        console.error('Failed to load suites:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSuites()
  }, [floorId, propertyId, floorName])

  // Load existing layout if available
  useEffect(() => {
    async function loadLayout() {
      if (!floorId) return
      
      try {
        const layout = await publicApi.getFloorLayout(floorId)
        if (layout?.suites) {
          const existing = layout.suites.map((s: any) => ({
            id: `suite-${s.id}`,
            suiteId: s.id,
            suiteNumber: s.suite_number,
            suiteName: s.name,
            x: (s.col_start - 1) * 140,
            y: (s.row_start - 1) * 140,
            width: (s.col_span || 1) * 140,
            height: (s.row_span || 1) * 140,
            rotation: s.rotation || 0,
            shape: 'rectangle' as SuiteShape,
            color: s.status === 'available' ? COLORS.available : 
                  s.status === 'reserved' ? COLORS.reserved : COLORS.sold,
            label: s.suite_number || s.name,
            status: s.status,
            area: s.size_sqm,
            price: s.price,
            floorId,
            blockId,
            propertyId,
          }))
          setPlacements(existing)
        }
      } catch (error) {
        console.log('No existing layout found')
      }
    }
    
    loadLayout()
  }, [floorId, blockId, propertyId])

  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y })
      return
    }

    if (activeTool === 'select') {
      // Check if clicked on a placement
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const clickX = (e.clientX - rect.left - canvasOffset.x) / zoom
      const clickY = (e.clientY - rect.top - canvasOffset.y) / zoom
      
      const clicked = placements.find((p) => {
        return (
          clickX >= p.x &&
          clickX <= p.x + p.width &&
          clickY >= p.y &&
          clickY <= p.y + p.height
        )
      })
      
      if (clicked) {
        setSelectedId(clicked.id)
        setIsDragging(true)
        setDragOffset({
          x: clickX - clicked.x,
          y: clickY - clicked.y,
        })
      } else {
        setSelectedId(null)
      }
    }
  }, [activeTool, placements, canvasOffset, zoom])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
      return
    }

    if (isDragging && selectedId) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const mouseX = (e.clientX - rect.left - canvasOffset.x) / zoom
      const mouseY = (e.clientY - rect.top - canvasOffset.y) / zoom
      
      let newX = mouseX - dragOffset.x
      let newY = mouseY - dragOffset.y
      
      if (snapToGrid) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE
      }
      
      setPlacements((prev) =>
        prev.map((p) =>
          p.id === selectedId ? { ...p, x: newX, y: newY } : p
        )
      )
    }
  }, [isDragging, isPanning, selectedId, dragOffset, canvasOffset, snapToGrid, zoom, panStart])

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsPanning(false)
  }, [])

  // Create new shape
  const createShape = (shape: SuiteShape, x: number, y: number) => {
    const template = SHAPE_TEMPLATES[shape as keyof typeof SHAPE_TEMPLATES] || SHAPE_TEMPLATES.rectangle
    const newPlacement: SuitePlacement = {
      id: `shape-${Date.now()}`,
      x: snapToGrid ? Math.round(x / GRID_SIZE) * GRID_SIZE : x,
      y: snapToGrid ? Math.round(y / GRID_SIZE) * GRID_SIZE : y,
      width: template.width,
      height: template.height,
      rotation: 0,
      shape,
      color: COLORS.available,
      label: 'Unassigned',
      status: 'available',
      floorId: floorId || 0,
      blockId,
      propertyId,
    }
    setPlacements((prev) => [...prev, newPlacement])
    setSelectedId(newPlacement.id)
  }

  // Auto-arrange placements
  const autoArrange = () => {
    const gridCols = Math.ceil(Math.sqrt(placements.length))
    const spacing = 140
    
    const arranged = placements.map((p, index) => {
      const col = index % gridCols
      const row = Math.floor(index / gridCols)
      return {
        ...p,
        x: col * spacing + 50,
        y: row * spacing + 50,
      }
    })
    
    setPlacements(arranged)
  }

  // Auto-map suites to placements
  const autoMapSuites = () => {
    const availableSuites = unassignedSuites.filter(s => s.status === 'available')
    const unassignedPlacements = placements.filter(p => !p.suiteId && p.status === 'available')
    
    // Sort suites by area (largest first) and match to placements
    const sortedSuites = [...availableSuites].sort((a, b) => b.area - a.area)
    
    const updated = placements.map((p, index) => {
      if (p.suiteId || sortedSuites.length === 0) return p
      
      const suite = sortedSuites.shift()
      if (!suite) return p
      
      return {
        ...p,
        suiteId: suite.id,
        suiteNumber: suite.suiteNumber,
        suiteName: suite.name,
        label: suite.suiteNumber,
        area: suite.area,
        price: suite.price,
        status: suite.status,
        color: suite.status === 'available' ? COLORS.available : 
               suite.status === 'reserved' ? COLORS.reserved : COLORS.sold,
      }
    })
    
    setPlacements(updated)
  }

  // Assign suite to placement
  const assignSuite = (suiteId: number) => {
    if (!selectedId) return
    
    const suite = unassignedSuites.find(s => s.id === suiteId)
    if (!suite) return
    
    setPlacements(prev => prev.map(p => 
      p.id === selectedId ? {
        ...p,
        suiteId: suite.id,
        suiteNumber: suite.suiteNumber,
        suiteName: suite.name,
        label: suite.suiteNumber,
        area: suite.area,
        price: suite.price,
        status: suite.status,
        color: suite.status === 'available' ? COLORS.available : 
               suite.status === 'reserved' ? COLORS.reserved : COLORS.sold,
      } : p
    ))
  }

  // Delete placement
  const deletePlacement = (id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // Update placement property
  const updatePlacement = (id: string, updates: Partial<SuitePlacement>) => {
    setPlacements((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  // Handle file upload for background
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Save layout
  const handleSave = async () => {
    // Convert placements to layout data for backend
    const layoutData = placements.map(p => ({
      suite_id: p.suiteId,
      col_start: Math.floor(p.x / 140) + 1,
      col_span: Math.ceil(p.width / 140),
      row_start: Math.floor(p.y / 140) + 1,
      row_span: Math.ceil(p.height / 140),
      rotation: p.rotation,
      custom_css: JSON.stringify({
        width: p.width,
        height: p.height,
        x: p.x,
        y: p.y,
      }),
    }))
    
    onSave?.(placements)
    
    // Show success feedback
    alert('Layout saved successfully!')
  }

  // Get selected placement
  const selectedPlacement = useMemo(
    () => placements.find((p) => p.id === selectedId),
    [placements, selectedId]
  )

  // Calculate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return null
    
    const lines = []
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={CANVAS_HEIGHT}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-text/10 dark:text-white/10"
        />
      )
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={CANVAS_WIDTH}
          y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-text/10 dark:text-white/10"
        />
      )
    }
    return lines
  }, [showGrid])

  return (
    <div className="fixed inset-0 bg-bg dark:bg-[#030712] z-50 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-heading font-semibold text-lg text-text dark:text-white">
              Floor Plan Editor
            </h1>
            <p className="text-xs text-text/50 dark:text-white/50">
              {floorName} {blockId && `• Block ${blockId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToolbarButton
            active={showGrid}
            onClick={() => setShowGrid(!showGrid)}
            icon={showGrid ? Eye : EyeOff}
            label="Grid"
            tooltip="Toggle grid visibility"
          />
          <ToolbarButton
            active={snapToGrid}
            onClick={() => setSnapToGrid(!snapToGrid)}
            icon={Grid3X3}
            label="Snap"
            tooltip="Snap to grid"
          />
          <div className="h-8 w-px bg-border dark:border-white/10 mx-2" />
          <ToolbarButton
            onClick={autoArrange}
            icon={RefreshCw}
            label="Arrange"
            tooltip="Auto-arrange all suites"
          />
          <ToolbarButton
            onClick={autoMapSuites}
            icon={Wand2}
            label="Auto-Map"
            tooltip="Auto-assign suites to shapes"
          />
          <div className="h-8 w-px bg-border dark:border-white/10 mx-2" />
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/30"
          >
            <Save className="w-4 h-4" />
            Save Layout
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-text dark:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools & Unassigned Suites */}
        <aside className="w-80 border-r border-border dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex flex-col shrink-0">
          {/* Tools Section */}
          <div className="p-4 border-b border-border dark:border-white/10">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 font-semibold mb-3">
              Tools
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ToolbarButton
                active={activeTool === 'select'}
                onClick={() => setActiveTool('select')}
                icon={Move}
                label="Select"
              />
              <ToolbarButton
                active={activeTool === 'pan'}
                onClick={() => setActiveTool('pan')}
                icon={Layers}
                label="Pan"
              />
            </div>
          </div>

          {/* Shape Tools */}
          <div className="p-4 border-b border-border dark:border-white/10">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 font-semibold mb-3">
              Add Shape
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => createShape('rectangle', 100, 100)}
                className="p-3 rounded-lg border border-border dark:border-white/10 hover:border-accent dark:hover:border-accent transition-colors text-center"
              >
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-current rounded" />
                <span className="text-xs text-text/70 dark:text-white/70">Rectangle</span>
              </button>
              <button
                onClick={() => createShape('l-shape', 100, 100)}
                className="p-3 rounded-lg border border-border dark:border-white/10 hover:border-accent dark:hover:border-accent transition-colors text-center"
              >
                <div className="w-8 h-8 mx-auto mb-2 relative">
                  <div className="absolute inset-0 border-2 border-current rounded-l" style={{ clipPath: 'polygon(0 0, 60% 0, 60% 40%, 100% 40%, 100% 100%, 0 100%)' }} />
                </div>
                <span className="text-xs text-text/70 dark:text-white/70">L-Shape</span>
              </button>
              <button
                onClick={() => createShape('u-shape', 100, 100)}
                className="p-3 rounded-lg border border-border dark:border-white/10 hover:border-accent dark:hover:border-accent transition-colors text-center"
              >
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-current rounded" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 30%, 70% 30%, 70% 100%, 30% 100%, 30% 30%, 0 30%)' }} />
                <span className="text-xs text-text/70 dark:text-white/70">U-Shape</span>
              </button>
              <button
                onClick={() => createShape('corner', 100, 100)}
                className="p-3 rounded-lg border border-border dark:border-white/10 hover:border-accent dark:hover:border-accent transition-colors text-center"
              >
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-current rounded-tr" />
                <span className="text-xs text-text/70 dark:text-white/70">Corner</span>
              </button>
            </div>
          </div>

          {/* Unassigned Suites */}
          <div className="flex-1 flex flex-col min-h-0">
            <button
              onClick={() => setShowUnassigned(!showUnassigned)}
              className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-text/50 dark:text-white/50 font-semibold">
                Unassigned Suites ({unassignedSuites.filter(s => !placements.some(p => p.suiteId === s.id)).length})
              </h3>
              {showUnassigned ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            <AnimatePresence>
              {showUnassigned && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <div className="p-4 space-y-2 overflow-y-auto h-full">
                    {unassignedSuites
                      .filter(s => !placements.some(p => p.suiteId === s.id))
                      .map(suite => (
                        <div
                          key={suite.id}
                          onClick={() => selectedId && assignSuite(suite.id)}
                          className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                            selectedId
                              ? 'border-accent/50 hover:border-accent hover:bg-accent/5'
                              : 'border-border dark:border-white/10 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-text dark:text-white">
                              {suite.suiteNumber}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              suite.status === 'available' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              suite.status === 'reserved' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {suite.status}
                            </span>
                          </div>
                          <div className="text-xs text-text/50 dark:text-white/50">
                            {suite.area} sqm • ₦{(suite.price / 1000000).toFixed(1)}M
                          </div>
                        </div>
                      ))}
                    
                    {unassignedSuites.filter(s => !placements.some(p => p.suiteId === s.id)).length === 0 && (
                      <div className="text-center py-8 text-text/40 dark:text-white/40 text-sm">
                        All suites assigned
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-[#030712]">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white dark:bg-[#0a0a0a] rounded-lg p-1 shadow-lg border border-border dark:border-white/10">
              <button
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-white/5 text-text dark:text-white"
              >
                -
              </button>
              <span className="text-sm font-medium text-text dark:text-white w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-white/5 text-text dark:text-white"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.svg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0a0a0a] rounded-lg border border-border dark:border-white/10 text-sm font-medium text-text dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors shadow-lg"
              >
                <Upload className="w-4 h-4" />
                Upload Floor Plan
              </button>
              {backgroundImage && (
                <button
                  onClick={() => setBackgroundImage(null)}
                  className="px-4 py-2 bg-white dark:bg-[#0a0a0a] rounded-lg border border-border dark:border-white/10 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-lg"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Canvas Container */}
          <div
            ref={canvasRef}
            className={`absolute inset-0 ${activeTool === 'pan' || isPanning ? 'cursor-grab' : 'cursor-default'} ${isPanning ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <div
              className="absolute"
              style={{
                transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              {/* Background Image */}
              {backgroundImage && (
                <img
                  src={backgroundImage}
                  alt="Floor Plan"
                  className="absolute pointer-events-none select-none"
                  style={{
                    maxWidth: CANVAS_WIDTH,
                    maxHeight: CANVAS_HEIGHT,
                    opacity: 0.3,
                  }}
                />
              )}

              {/* Grid SVG */}
              <svg
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="absolute pointer-events-none"
              >
                {gridLines}
                
                {/* Canvas border */}
                <rect
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-text/20 dark:text-white/20"
                />
              </svg>

              {/* Placements */}
              {placements.map((placement) => (
                <div
                  key={placement.id}
                  className={`absolute group transition-shadow ${
                    selectedId === placement.id ? 'z-50' : 'z-10'
                  }`}
                  style={{
                    left: placement.x,
                    top: placement.y,
                    width: placement.width,
                    height: placement.height,
                    transform: `rotate(${placement.rotation}deg)`,
                    transformOrigin: 'center',
                  }}
                >
                  {/* Selection border */}
                  {selectedId === placement.id && (
                    <div className="absolute -inset-1 border-2 border-accent rounded-lg pointer-events-none" />
                  )}
                  
                  {/* Shape */}
                  <div
                    className={`w-full h-full rounded-lg border-2 flex flex-col items-center justify-center cursor-move transition-all ${
                      selectedId === placement.id
                        ? 'shadow-lg shadow-accent/30'
                        : 'hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: `${placement.color}20`,
                      borderColor: placement.color,
                    }}
                  >
                    <span className="text-sm font-semibold text-text dark:text-white truncate px-2 max-w-full">
                      {placement.label}
                    </span>
                    {placement.area && (
                      <span className="text-[10px] text-text/60 dark:text-white/60">
                        {placement.area} sqm
                      </span>
                    )}
                  </div>

                  {/* Delete button (visible on hover or when selected) */}
                  {(selectedId === placement.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePlacement(placement.id)
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 border-l border-border dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex flex-col shrink-0">
          {selectedPlacement ? (
            <>
              <div className="p-4 border-b border-border dark:border-white/10">
                <h3 className="font-heading font-semibold text-lg text-text dark:text-white mb-1">
                  {selectedPlacement.label}
                </h3>
                <p className="text-xs text-text/50 dark:text-white/50">
                  {selectedPlacement.suiteName || 'Unassigned Suite'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Position */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] text-text/50 dark:text-white/50 font-semibold">
                    Position
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <PropertyInput
                      label="X Position"
                      value={selectedPlacement.x}
                      onChange={(v) => updatePlacement(selectedPlacement.id, { x: Number(v) })}
                      type="number"
                      suffix="px"
                    />
                    <PropertyInput
                      label="Y Position"
                      value={selectedPlacement.y}
                      onChange={(v) => updatePlacement(selectedPlacement.id, { y: Number(v) })}
                      type="number"
                      suffix="px"
                    />
                  </div>
                </div>

                {/* Size */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] text-text/50 dark:text-white/50 font-semibold">
                    Size
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <PropertyInput
                      label="Width"
                      value={selectedPlacement.width}
                      onChange={(v) => updatePlacement(selectedPlacement.id, { width: Number(v) })}
                      type="number"
                      min={40}
                      max={400}
                      suffix="px"
                    />
                    <PropertyInput
                      label="Height"
                      value={selectedPlacement.height}
                      onChange={(v) => updatePlacement(selectedPlacement.id, { height: Number(v) })}
                      type="number"
                      min={40}
                      max={400}
                      suffix="px"
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] text-text/50 dark:text-white/50 font-semibold">
                    Rotation
                  </h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={15}
                      value={selectedPlacement.rotation}
                      onChange={(e) => updatePlacement(selectedPlacement.id, { rotation: Number(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <span className="text-sm font-medium text-text dark:text-white w-12 text-right">
                      {selectedPlacement.rotation}°
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 90, 180, 270].map((angle) => (
                      <button
                        key={angle}
                        onClick={() => updatePlacement(selectedPlacement.id, { rotation: angle })}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                          selectedPlacement.rotation === angle
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border dark:border-white/10 text-text/60 dark:text-white/60 hover:border-accent/50'
                        }`}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] text-text/50 dark:text-white/50 font-semibold">
                    Status
                  </h4>
                  <div className="flex gap-2">
                    {(['available', 'reserved', 'sold'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updatePlacement(selectedPlacement.id, { 
                          status,
                          color: COLORS[status]
                        })}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border capitalize transition-colors ${
                          selectedPlacement.status === status
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border dark:border-white/10 text-text/60 dark:text-white/60 hover:border-accent/50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suite Assignment */}
                {selectedPlacement.suiteId && (
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text/50 dark:text-white/50">Assigned Suite</span>
                      <button
                        onClick={() => updatePlacement(selectedPlacement.id, { 
                          suiteId: undefined,
                          suiteNumber: undefined,
                          suiteName: undefined,
                          label: 'Unassigned'
                        })}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Unassign
                      </button>
                    </div>
                    <div className="text-sm font-medium text-text dark:text-white">
                      {selectedPlacement.suiteNumber}
                    </div>
                    <div className="text-xs text-text/50 dark:text-white/50">
                      {selectedPlacement.area} sqm • ₦{(selectedPlacement.price || 0) / 1000000}M
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-border dark:border-white/10 space-y-2">
                  <button
                    onClick={() => deletePlacement(selectedPlacement.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Shape
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-text/30 dark:text-white/30" />
              </div>
              <p className="text-text/50 dark:text-white/50 text-sm">
                Select a shape to edit its properties
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default FloorPlanEditor
