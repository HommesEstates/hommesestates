'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProvided, type DraggableProvided } from '@hello-pangea/dnd'

type NavItem = {
  id: string
  label: string
  href: string
  position: number
  visible: boolean
  parentId: string | null
  location: string
  children?: NavItem[]
}

export default function NavigationBuilderPage() {
  const [headerTree, setHeaderTree] = useState<NavItem[]>([])
  const [footerTree, setFooterTree] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)

  const [newLink, setNewLink] = useState<{ location: 'header' | 'footer'; label: string; href: string; parentId?: string | null }>({ location: 'header', label: '', href: '', parentId: null })

  const load = async () => {
    setLoading(true)
    try {
      const [hRes, fRes] = await Promise.all([
        fetch('/api/admin/navigation?location=header&nested=true'),
        fetch('/api/admin/navigation?location=footer&nested=true'),
      ])
      const [h, f] = await Promise.all([hRes.json(), fRes.json()])
      setHeaderTree(h)
      setFooterTree(f)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!newLink.label || !newLink.href) return
    try {
      const res = await fetch('/api/admin/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: newLink.location,
          label: newLink.label,
          href: newLink.href,
          parentId: newLink.parentId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add link')
      setNewLink({ location: newLink.location, label: '', href: '', parentId: null })
      toast.success('Link added')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const flatten = (nodes: NavItem[]) => nodes.map(n => n)

  const onDragEnd = async (result: DropResult, location: 'header' | 'footer', parentId: string | null) => {
    if (!result.destination) return
    const tree = location === 'header' ? headerTree : footerTree
    let list: NavItem[]
    if (parentId) {
      const parent = findNode(tree, parentId)
      list = parent?.children || []
    } else {
      list = tree
    }
    const items = Array.from(list)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    try {
      const res = await fetch('/api/admin/navigation/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, parentId, orderedIds: items.map(i => i.id) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reorder')
      }
      toast.success('Reordered')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const findNode = (nodes: NavItem[], id: string): NavItem | undefined => {
    for (const n of nodes) {
      if (n.id === id) return n
      const c = findNode(n.children || [], id)
      if (c) return c
    }
    return undefined
  }

  const updateLink = async (id: string, patch: Partial<NavItem>) => {
    try {
      const res = await fetch(`/api/admin/navigation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return
    try {
      const res = await fetch(`/api/admin/navigation/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const renderList = (location: 'header' | 'footer', nodes: NavItem[], parentId: string | null = null) => (
    <Droppable droppableId={`${location}-${parentId || 'root'}`}>
      {(provided: DroppableProvided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
          {nodes.map((n, index) => (
            <Draggable draggableId={n.id} index={index} key={n.id}>
              {(dragProvided: DraggableProvided) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div {...dragProvided.dragHandleProps} className="cursor-grab text-text/40 dark:text-white/40">⋮⋮</div>
                      <input
                        className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800"
                        value={n.label}
                        onChange={(e) => updateLink(n.id, { label: e.target.value })}
                      />
                      <input
                        className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 w-64"
                        value={n.href}
                        onChange={(e) => updateLink(n.id, { href: e.target.value })}
                      />
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={n.visible} onChange={(e) => updateLink(n.id, { visible: e.target.checked })} />
                        Visible
                      </label>
                    </div>
                    <button onClick={() => deleteLink(n.id)} className="px-2 py-1 rounded bg-red-600 text-white text-sm">Delete</button>
                  </div>

                  {n.children && n.children.length > 0 && (
                    <div className="pl-8 mt-2">
                      {renderList(location, n.children, n.id)}
                    </div>
                  )}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )

  const topLevelOptions = useMemo(() => ({
    header: [{ id: '', label: '(Top Level)' }, ...flatten(headerTree).map(n => ({ id: n.id, label: n.label }))],
    footer: [{ id: '', label: '(Top Level)' }, ...flatten(footerTree).map(n => ({ id: n.id, label: n.label }))],
  }), [headerTree, footerTree])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Navigation Builder</h1>
          <p className="text-text/60 dark:text-white/60">Manage header and footer menus</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Header</h2>
          </div>
          <DragDropContext onDragEnd={(r: DropResult) => onDragEnd(r, 'header', null)}>
            {renderList('header', headerTree, null)}
          </DragDropContext>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Footer</h2>
          </div>
          <DragDropContext onDragEnd={(r: DropResult) => onDragEnd(r, 'footer', null)}>
            {renderList('footer', footerTree, null)}
          </DragDropContext>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h3 className="font-semibold mb-3">Add Link</h3>
        <div className="grid md:grid-cols-5 gap-3">
          <select value={newLink.location} onChange={(e) => setNewLink({ ...newLink, location: e.target.value as any })} className="px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-800">
            <option value="header">Header</option>
            <option value="footer">Footer</option>
          </select>
          <input value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })} placeholder="Label" className="px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-800" />
          <input value={newLink.href} onChange={(e) => setNewLink({ ...newLink, href: e.target.value })} placeholder="Href" className="px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-800" />
          <select value={newLink.parentId || ''} onChange={(e) => setNewLink({ ...newLink, parentId: e.target.value || null })} className="px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-800">
            {(newLink.location === 'header' ? topLevelOptions.header : topLevelOptions.footer).map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <button onClick={handleAdd} className="px-4 py-2 rounded bg-accent text-white">Add</button>
        </div>
      </div>

      {loading && <p>Loading…</p>}
    </div>
  )
}
