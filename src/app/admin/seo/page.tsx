'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Page = { id: string; title: string; slug: string }

type SEO = {
  metaTitle: string
  metaDescription: string
  keywords: string[]
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: string | null
  twitterCard?: string | null
  canonicalUrl?: string | null
  noindex?: boolean
  nofollow?: boolean
}

export default function SEOEditorPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [pageId, setPageId] = useState<string>('')
  const [seo, setSeo] = useState<SEO | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/admin/pages')
      const data = await res.json()
      setPages(data.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug })))
      if (data.length) setPageId(data[0].id)
    })()
  }, [])

  useEffect(() => {
    if (!pageId) return
    ;(async () => {
      const res = await fetch(`/api/admin/seo?pageId=${pageId}`)
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to load SEO')
      setSeo(data)
    })()
  }, [pageId])

  const onChange = (key: keyof SEO, value: any) => setSeo((prev) => ({ ...(prev as any), [key]: value }))

  const save = async () => {
    if (!pageId || !seo) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/seo?pageId=${pageId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seo) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      toast.success('SEO saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">SEO Editor</h1>
          <p className="text-text/60 dark:text-white/60">Edit meta and social tags per page</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={pageId} onChange={(e) => setPageId(e.target.value)} className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.title} /{p.slug}</option>
            ))}
          </select>
          <button onClick={save} className="px-4 py-2 rounded-xl bg-accent text-white">{saving ? 'Saving…' : 'Save SEO'}</button>
        </div>
      </div>

      {!seo ? (
        <p>Loading…</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h2 className="font-semibold mb-2">Meta</h2>
            <label className="text-sm">Meta Title</label>
            <input value={seo.metaTitle || ''} onChange={(e) => onChange('metaTitle', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <label className="text-sm">Meta Description</label>
            <textarea value={seo.metaDescription || ''} onChange={(e) => onChange('metaDescription', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <label className="text-sm">Keywords (comma separated)</label>
            <input value={(seo.keywords || []).join(', ')} onChange={(e) => onChange('keywords', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <h2 className="font-semibold mb-2">Social & Robots</h2>
            <label className="text-sm">OG Title</label>
            <input value={seo.ogTitle || ''} onChange={(e) => onChange('ogTitle', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <label className="text-sm">OG Description</label>
            <textarea value={seo.ogDescription || ''} onChange={(e) => onChange('ogDescription', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <label className="text-sm">OG Image URL</label>
            <input value={seo.ogImage || ''} onChange={(e) => onChange('ogImage', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <label className="text-sm">Twitter Card</label>
            <input value={seo.twitterCard || ''} onChange={(e) => onChange('twitterCard', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <label className="text-sm">Canonical URL</label>
            <input value={seo.canonicalUrl || ''} onChange={(e) => onChange('canonicalUrl', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!seo.noindex} onChange={(e) => onChange('noindex', e.target.checked)} />
              noindex
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!seo.nofollow} onChange={(e) => onChange('nofollow', e.target.checked)} />
              nofollow
            </label>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold mb-2">Preview</h2>
            <div className="space-y-1">
              <div className="text-[#1a0dab] text-xl">{seo.metaTitle || 'Page Title'} - Hommes Estates</div>
              <div className="text-[#006621] text-sm">https://hommesestates.com/{pages.find((p) => p.id === pageId)?.slug}</div>
              <div className="text-[#545454] text-sm">{seo.metaDescription || 'Meta description preview will appear here.'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
