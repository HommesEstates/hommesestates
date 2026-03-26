'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function NewPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isHomepage, setIsHomepage] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, description, isHomepage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create page')
      toast.success('Page created')
      router.push(`/admin/pages/${data.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-heading font-bold mb-4">Create New Page</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            placeholder="about, investors, contact"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          />
        </div>
        <label className="inline-flex items-center gap-3">
          <input type="checkbox" checked={isHomepage} onChange={(e) => setIsHomepage(e.target.checked)} />
          <span>Set as Homepage</span>
        </label>
        <div className="flex gap-3">
          <button disabled={loading} className="px-4 py-2 rounded-xl bg-accent text-white">{loading ? 'Creating...' : 'Create Page'}</button>
        </div>
      </form>
    </div>
  )
}
