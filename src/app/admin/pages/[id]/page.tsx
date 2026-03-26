'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProvided, type DraggableProvided } from '@hello-pangea/dnd'
import { Eye, EyeOff, GripVertical } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'


interface Page {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  description?: string | null
  isHomepage?: boolean
}

interface Section {
  id: string
  type: string
  title?: string | null
  order: number
  content: any
  isVisible: boolean
}

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionContent, setNewSectionContent] = useState('')
  const [saving, setSaving] = useState(false)
  const editor = useEditor({
    extensions: [StarterKit],
    content: newSectionContent,
    onUpdate: ({ editor }) => setNewSectionContent(editor.getHTML()),
    immediatelyRender: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`/api/admin/pages/${id}`),
          fetch(`/api/admin/sections?pageId=${id}`),
        ])
        const pData = await pRes.json()
        const sData = await sRes.json()
        setPage(pData)
        setSections((sData || []).sort((a: Section, b: Section) => a.order - b.order))
      } catch (e) {
        toast.error('Failed to load page')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const addTextSection = async () => {
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: id,
          type: 'TEXT_BLOCK',
          title: newSectionTitle || 'Text Block',
          content: { html: newSectionContent },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add section')
      setSections((prev) => [...prev, data].sort((a, b) => a.order - b.order))
      setNewSectionTitle('')
      setNewSectionContent('')
      toast.success('Section added')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(sections)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    // Reindex orders in UI
    const reindexed = items.map((s, idx) => ({ ...s, order: idx }))
    setSections(reindexed)
    try {
      const res = await fetch('/api/admin/sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: id,
          order: reindexed.map((s) => ({ id: s.id, order: s.order })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reorder')
      }
      toast.success('Sections reordered')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const toggleVisibility = async (section: Section) => {
    try {
      const res = await fetch(`/api/admin/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !section.isVisible }),
      })
      if (!res.ok) throw new Error('Failed to update section')
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, isVisible: !s.isVisible } : s)))
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const updatePage = async (patch: Partial<Page>) => {
    if (!page) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update page')
      setPage((prev) => ({ ...prev!, ...patch }))
      toast.success('Page updated')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (!page) return <p>Page not found</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Edit: {page.title}</h1>
          <p className="text-text/60 dark:text-white/60">/{page.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={page.status}
            onChange={(e) => updatePage({ status: e.target.value as Page['status'] })}
            className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!page.isHomepage}
              onChange={(e) => updatePage({ isHomepage: e.target.checked })}
            />
            Set as homepage
          </label>
          <button disabled className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-sm">
            {saving ? 'Saving...' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections">
              {(provided: DroppableProvided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {sections.map((s, index) => (
                    <Draggable draggableId={s.id} index={index} key={s.id}>
                      {(dragProvided: DraggableProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div {...dragProvided.dragHandleProps} className="cursor-grab text-text/40 dark:text-white/40">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <h3 className="font-semibold">{s.title || s.type}</h3>
                              <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">{s.type}</span>
                            </div>
                            <button
                              onClick={() => toggleVisibility(s)}
                              className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800"
                              title={s.isVisible ? 'Hide' : 'Show'}
                            >
                              {s.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </div>
                          {s.type === 'TEXT_BLOCK' ? (
                            <div dangerouslySetInnerHTML={{ __html: s.content?.html || '' }} className="prose dark:prose-invert max-w-none" />
                          ) : (
                            <p className="text-sm text-text/60 dark:text-white/60">Unsupported section preview</p>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {sections.length === 0 && (
                    <div className="text-text/60 dark:text-white/60">No sections yet</div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Add Text Section</h3>
            <input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Section title"
              className="w-full px-3 py-2 mb-3 rounded-lg bg-neutral-100 dark:bg-neutral-800"
            />
            <div className="border rounded-lg p-2 bg-neutral-50 dark:bg-neutral-800">
              {editor && <EditorContent editor={editor} />}
            </div>
            <button onClick={addTextSection} className="mt-3 w-full px-4 py-2 rounded-lg bg-accent text-white">Add Section</button>
          </div>
        </div>
      </div>
    </div>
  )
}
