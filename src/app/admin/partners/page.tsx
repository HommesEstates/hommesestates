'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Partner = {
  id: string
  name: string
  logoUrl?: string | null
  website?: string | null
  isActive: boolean
  order: number
}

export default function PartnersAdminPage() {
  const [items, setItems] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', logoUrl: '', website: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/partners')
      const data = await res.json()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const res = await fetch('/api/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add partner')
      setForm({ name: '', logoUrl: '', website: '' })
      toast.success('Partner added')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const update = async (id: string, patch: Partial<Partner>) => {
    const res = await fetch(`/api/partners/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to update')
    } else {
      load()
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete partner?')) return
    const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to delete')
    } else {
      load()
    }
  }

  const move = async (idx: number, dir: -1 | 1) => {
    const target = items[idx]
    const swapIdx = idx + dir
    if (!target || !items[swapIdx]) return
    await Promise.all([
      update(target.id, { order: items[swapIdx].order }),
      update(items[swapIdx].id, { order: target.order }),
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Partners</h1>
          <p className="text-text/60 dark:text-white/60">Manage partner logos and links</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold mb-3">Add Partner</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <input placeholder="Logo URL" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="flex gap-2">
            <input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-1" />
            <button onClick={add} className="px-4 py-2 rounded-xl bg-accent text-white whitespace-nowrap">{saving ? 'Adding…' : 'Add'}</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold mb-3">All Partners</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((p, idx) => (
              <div key={p.id} className="py-3 grid md:grid-cols-12 items-center gap-3">
                <div className="md:col-span-3 flex items-center gap-2">
                  {p.logoUrl ? (<img src={p.logoUrl} alt={p.name} className="w-10 h-10 object-contain" />) : (<div className="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-800" />)}
                  <input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                </div>
                <input value={p.logoUrl || ''} onChange={(e) => update(p.id, { logoUrl: e.target.value })} className="md:col-span-4 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                <input value={p.website || ''} onChange={(e) => update(p.id, { website: e.target.value })} className="md:col-span-3 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="md:col-span-2 flex items-center gap-2 justify-end">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!p.isActive} onChange={(e) => update(p.id, { isActive: e.target.checked })} /> Active
                  </label>
                  <button onClick={() => move(idx, -1)} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">↑</button>
                  <button onClick={() => move(idx, 1)} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">↓</button>
                  <button onClick={() => remove(p.id)} className="px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-text/60 dark:text-white/60">No partners yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
