'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function ThemeEditorPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/theme')
      const data = await res.json()
      setTheme(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/theme', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        colors: theme.colors,
        typography: theme.typography,
        spacing: theme.spacing,
        borderRadius: theme.borderRadius,
        animations: theme.animations,
        layout: theme.layout,
      }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save theme')
      toast.success('Theme saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const set = (path: string, value: any) => {
    setTheme((prev: any) => {
      const next = { ...prev }
      const parts = path.split('.')
      let cur: any = next
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i]
        cur[k] = { ...(cur[k] || {}) }
        cur = cur[k]
      }
      cur[parts[parts.length - 1]] = value
      return next
    })
  }

  const colorInput = (label: string, key: string) => (
    <div className="flex items-center gap-3">
      <label className="w-40 text-sm">{label}</label>
      <input type="color" value={theme.colors[key] || '#000000'} onChange={(e) => set(`colors.${key}`, e.target.value)} />
      <input value={theme.colors[key] || ''} onChange={(e) => set(`colors.${key}`, e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    </div>
  )

  if (loading || !theme) return <p>Loading…</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Theme</h1>
          <p className="text-text/60 dark:text-white/60">Colors, typography, spacing</p>
        </div>
        <button onClick={save} className="px-4 py-2 rounded-xl bg-accent text-white">{saving ? 'Saving…' : 'Save Theme'}</button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <h2 className="font-semibold">Colors</h2>
          {colorInput('Primary', 'primary')}
          {colorInput('Secondary', 'secondary')}
          {colorInput('Accent', 'accent')}
          {colorInput('Muted', 'muted')}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h2 className="font-semibold">Typography</h2>
          <label className="text-sm">Body Font</label>
          <input value={theme.typography.body || ''} onChange={(e) => set('typography.body', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <label className="text-sm">Heading Font</label>
          <input value={theme.typography.heading || ''} onChange={(e) => set('typography.heading', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h2 className="font-semibold">Layout</h2>
          <label className="text-sm">Container</label>
          <input value={theme.spacing.container || ''} onChange={(e) => set('spacing.container', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <label className="text-sm">Section Padding</label>
          <input value={theme.layout.sectionPadding || ''} onChange={(e) => set('layout.sectionPadding', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <label className="text-sm">Base Radius</label>
          <input value={theme.borderRadius.base || ''} onChange={(e) => set('borderRadius.base', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
          <h2 className="font-semibold mb-2">Preview</h2>
          <div className="p-6 rounded-xl" style={{ background: theme.colors.muted }}>
            <h3 className="text-xl font-heading" style={{ color: theme.colors.primary }}>Heading Preview</h3>
            <p className="text-text/70" style={{ color: theme.colors.accent }}>Accent text example</p>
            <button className="mt-3 px-4 py-2 rounded" style={{ background: theme.colors.secondary, color: '#fff' }}>Primary Button</button>
          </div>
        </div>
      </div>
    </div>
  )
}
