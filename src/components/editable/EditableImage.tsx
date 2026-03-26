'use client'

import { useRef, useState } from 'react'
import { useEditMode } from '@/components/providers/EditModeProvider'
import toast from 'react-hot-toast'

export default function EditableImage({
  sectionId,
  path,
  src,
  alt,
  className,
}: {
  sectionId: string
  path: string
  src: string
  alt?: string
  className?: string
}) {
  const { isEditMode } = useEditMode()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const change = async () => {
    const next = prompt('Enter image URL', src)
    if (!next || next === src) return
    await fetch(`/api/admin/sections/path/${sectionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, value: next }),
    })
    window.location.reload()
  }

  const onUpload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      const url = data.thumbnailUrl || data.url
      await fetch(`/api/admin/sections/path/${sectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, value: url }),
      })
      toast.success('Image updated')
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || ''} className={className} />
      {isEditMode && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={change} className="px-2 py-1 rounded bg-secondary text-white text-xs">Change URL</button>
          <button onClick={() => inputRef.current?.click()} className="px-2 py-1 rounded bg-accent text-white text-xs disabled:opacity-60" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
          }} />
        </div>
      )}
    </div>
  )
}
