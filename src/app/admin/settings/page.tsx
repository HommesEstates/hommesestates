'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setForm(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')
      toast.success('Settings saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const input = (key: string, props?: any) => (
    <input
      value={form?.[key] || ''}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800"
      {...props}
    />
  )

  if (loading) return <p>Loading…</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-text/60 dark:text-white/60">Site identity, contact, integrations</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h2 className="font-semibold mb-2">Site</h2>
          <label className="text-sm">Site Name</label>
          {input('siteName')}
          <label className="text-sm">Tagline</label>
          {input('tagline')}
          <label className="text-sm">Logo URL</label>
          {input('logo')}
          <label className="text-sm">Favicon URL</label>
          {input('favicon')}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h2 className="font-semibold mb-2">Contact</h2>
          <label className="text-sm">Email</label>
          {input('contactEmail')}
          <label className="text-sm">Phone</label>
          {input('contactPhone')}
          <label className="text-sm">Address</label>
          {input('address')}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <h2 className="font-semibold mb-2">Integrations</h2>
          <label className="text-sm">Google Analytics ID</label>
          {input('googleAnalyticsId')}
          <label className="text-sm">Google Maps API Key</label>
          {input('googleMapsApiKey')}
          <label className="text-sm">Odoo API URL</label>
          {input('odooApiUrl')}
          <label className="text-sm">Odoo API Key</label>
          {input('odooApiKey')}
        </div>
      </div>

      <div>
        <button onClick={save} className="px-4 py-2 rounded-xl bg-accent text-white">{saving ? 'Saving…' : 'Save Settings'}</button>
      </div>
    </div>
  )
}
