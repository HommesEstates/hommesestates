'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditMode } from '@/components/providers/EditModeProvider'
import toast from 'react-hot-toast'

export default function EditableRichText({
  sectionId,
  path,
  html,
  className,
}: {
  sectionId: string
  path: string
  html: string
  className?: string
}) {
  const { isEditMode } = useEditMode()
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)
  const EditorContentRef = useRef<any>(null)
  const editorRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageExtRef = useRef<any>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const tiptap = await import('@tiptap/react')
      const StarterKit = (await import('@tiptap/starter-kit')).default
      let ImageExt: any = null
      try {
        ImageExt = (await import('@tiptap/extension-image')).default
        imageExtRef.current = ImageExt
      } catch {
        imageExtRef.current = null
      }
      if (!mounted) return
      editorRef.current = new tiptap.Editor({
        extensions: ImageExt ? [StarterKit, ImageExt] : [StarterKit],
        content: html || '',
        editorProps: { attributes: { class: 'prose dark:prose-invert max-w-none min-h-[160px] focus:outline-none' } },
      })
      EditorContentRef.current = tiptap.EditorContent
      setReady(true)
    })()
    return () => {
      mounted = false
      try { editorRef.current?.destroy?.() } catch {}
    }
  }, [html])

  const onUpload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      const url = data.url as string
      if (imageExtRef.current && editorRef.current?.chain) {
        editorRef.current.chain().focus().setImage({ src: url }).run()
      } else {
        editorRef.current?.commands?.insertContent?.(`<img src="${url}" alt="" />`)
        toast((t) => (
          <span>
            To fully support images in the editor, install <code>@tiptap/extension-image</code>.
          </span>
        ))
      }
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const save = async () => {
    if (!editorRef.current) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/sections/path/${sectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, value: editorRef.current.getHTML() }),
      })
      if (!res.ok) throw new Error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!isEditMode) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html || '' }} />
  }

  const EditorContent: any = EditorContentRef.current

  return (
    <div className={className}>
      {ready && EditorContent ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-2 mb-2 text-sm">
            <button onClick={() => editorRef.current?.chain().focus().toggleBold().run()} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">B</button>
            <button onClick={() => editorRef.current?.chain().focus().toggleItalic().run()} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 italic">I</button>
            <button onClick={() => editorRef.current?.chain().focus().toggleBulletList().run()} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">• List</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" disabled={uploading}>Image</button>
            <button onClick={save} className="ml-auto px-3 py-1 rounded bg-secondary text-white">{saving ? 'Saving…' : 'Save'}</button>
          </div>
          <EditorContent editor={editorRef.current} />
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
          }} />
        </div>
      ) : (
        <div className="text-text/60 dark:text-white/60">Loading editor…</div>
      )}
    </div>
  )
}
