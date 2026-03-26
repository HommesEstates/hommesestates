"use client"

import { useEffect, useState } from "react"
import { admin } from "@/lib/backend"

export default function AdminPropertiesPage() {
  const [list, setList] = useState<any[]>([])
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    try {
      const items = await admin.listPropertiesAdmin()
      setList(Array.isArray(items) ? items : [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load properties")
    }
  }

  useEffect(() => { load() }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await admin.createProperty({ name, code })
      setName("")
      setCode("")
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create property")
    } finally {
      setLoading(false)
    }
  }

  async function onPublish(id: number) {
    setBusyId(id)
    setError("")
    try {
      await admin.publishProperty(id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to publish property")
    } finally {
      setBusyId(null)
    }
  }

  async function onUnpublish(id: number) {
    setBusyId(id)
    setError("")
    try {
      await admin.unpublishProperty(id)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to unpublish property")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="section-container py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Properties</h1>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Code</label>
          <input className="border rounded px-3 py-2" value={code} onChange={(e)=>setCode(e.target.value)} required />
        </div>
        <button className="px-4 py-2 bg-copper-gradient text-white rounded disabled:opacity-60" disabled={loading}>{loading?"Creating...":"Create"}</button>
      </form>

      <div className="grid gap-3">
        {list.map((p)=> (
          <div key={p.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-xs text-gray-500">{p.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <a className="px-3 py-1 border rounded" href={`/admin/properties/${p.id}`}>Manage</a>
              <button className="px-3 py-1 border rounded" onClick={()=>onPublish(p.id)} disabled={busyId===p.id}>Publish</button>
              <button className="px-3 py-1 border rounded" onClick={()=>onUnpublish(p.id)} disabled={busyId===p.id}>Unpublish</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p>No properties.</p>}
      </div>
    </section>
  )
}
