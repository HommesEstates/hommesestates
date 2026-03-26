'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Testimonial = {
  id: string
  name: string
  role?: string | null
  company?: string | null
  quote: string
  rating?: number | null
  avatarUrl?: string | null
  isActive: boolean
  order: number
}

export default function TestimonialsAdminPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', company: '', quote: '', rating: 5, avatarUrl: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.name.trim() || !form.quote.trim()) return toast.error('Name and quote are required')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, rating: Number(form.rating) || 5 }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add testimonial')
      setForm({ name: '', role: '', company: '', quote: '', rating: 5 as any, avatarUrl: '' })
      toast.success('Testimonial added')
      load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const update = async (id: string, patch: Partial<Testimonial>) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Failed to update')
    } else {
      load()
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete testimonial?')) return
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
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
          <h1 className="text-2xl font-heading font-bold">Testimonials</h1>
          <p className="text-text/60 dark:text-white/60">Manage client testimonials</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold mb-3">Add Testimonial</h2>
        <div className="grid md:grid-cols-6 gap-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <input placeholder="Avatar URL" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <input placeholder="Rating (1-5)" type="number" min={1} max={5} value={form.rating as any} onChange={(e) => setForm({ ...form, rating: (e.target.value as any) })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="flex gap-2">
            <input placeholder="Quote" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-1" />
            <button onClick={add} className="px-4 py-2 rounded-xl bg-accent text-white whitespace-nowrap">{saving ? 'Adding…' : 'Add'}</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold mb-3">All Testimonials</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((t, idx) => (
              <div key={t.id} className="py-3 grid md:grid-cols-12 items-center gap-3">
                <div className="md:col-span-3 flex items-center gap-2">
                  {t.avatarUrl ? (<img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover" />) : (<div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />)}
                  <input value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                </div>
                <input value={t.role || ''} onChange={(e) => update(t.id, { role: e.target.value })} className="md:col-span-2 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                <input value={t.company || ''} onChange={(e) => update(t.id, { company: e.target.value })} className="md:col-span-2 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                <input value={t.quote} onChange={(e) => update(t.id, { quote: e.target.value })} className="md:col-span-3 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="md:col-span-2 flex items-center gap-2 justify-end">
                  <input type="number" min={1} max={5} value={t.rating || 5} onChange={(e) => update(t.id, { rating: Number(e.target.value) })} className="w-16 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800" />
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!t.isActive} onChange={(e) => update(t.id, { isActive: e.target.checked })} /> Active
                  </label>
                  <button onClick={() => move(idx, -1)} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">↑</button>
                  <button onClick={() => move(idx, 1)} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">↓</button>
                  <button onClick={() => remove(t.id)} className="px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-text/60 dark:text-white/60">No testimonials yet.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
