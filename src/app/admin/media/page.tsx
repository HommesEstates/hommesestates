'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

interface MediaItem {
  id: string
  url: string
  thumbnailUrl?: string | null
  originalName: string
  mimeType: string
  size: number
  category: string
  createdAt: string
  tags?: string[]
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const load = async () => {
    const res = await fetch('/api/admin/media')
    const data = await res.json()
    setItems(data)
  }

  useEffect(() => { load() }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return
    setUploading(true)
    try {
      for (const f of acceptedFiles) {
        const form = new FormData()
        form.append('file', f)
        const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `Failed to upload ${f.name}`)
      }
      toast.success(`Uploaded ${acceptedFiles.length} file(s)`) 
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const bulkDelete = async () => {
    if (selected.size === 0) return
    const ids = Array.from(selected)
    if (!confirm(`Delete ${ids.length} item(s)? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/admin/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bulk delete failed')
      toast.success('Deleted')
      clearSelection()
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const bulkTag = async () => {
    if (selected.size === 0) return
    const tagsStr = prompt('Enter tags (comma-separated):') || ''
    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
    try {
      const res = await fetch('/api/admin/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tag', ids: Array.from(selected), tags }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bulk tag failed')
      toast.success('Tags updated')
      clearSelection()
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const selectionCount = selected.size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Media Library</h1>
          <p className="text-text/60 dark:text-white/60">Upload and manage assets</p>
        </div>
        {selectionCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text/70 dark:text-white/70">{selectionCount} selected</span>
            <button onClick={bulkTag} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm">Set Tags</button>
            <button onClick={bulkDelete} className="px-3 py-2 rounded-lg bg-accent text-white text-sm">Delete</button>
            <button onClick={clearSelection} className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-sm">Clear</button>
          </div>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${isDragActive ? 'border-accent bg-accent/5' : 'border-neutral-200 dark:border-neutral-800'}`}
      >
        <input {...getInputProps()} />
        <p className="text-text/70 dark:text-white/70">{uploading ? 'Uploading...' : isDragActive ? 'Drop files here…' : 'Drag & drop files here, or click to select'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((m) => (
          <div
            key={m.id}
            onClick={() => toggleSelect(m.id)}
            className={`rounded-xl overflow-hidden border bg-white dark:bg-neutral-900 cursor-pointer ${selected.has(m.id) ? 'border-accent' : 'border-neutral-200 dark:border-neutral-800'}`}
            title={m.originalName}
          >
            <div className="aspect-square relative bg-neutral-100 dark:bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumbnailUrl || m.url} alt={m.originalName} className="w-full h-full object-cover" />
              {selected.has(m.id) && (
                <div className="absolute inset-0 ring-2 ring-accent pointer-events-none" />
              )}
            </div>
            <div className="p-3 text-xs">
              <div className="font-medium truncate">{m.originalName}</div>
              <div className="text-text/60 dark:text-white/60 truncate">{m.mimeType} • {(m.size/1024).toFixed(1)} KB</div>
              {m.tags && m.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px]">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-text/60 dark:text-white/60">No media yet</div>
        )}
      </div>
    </div>
  )
}
