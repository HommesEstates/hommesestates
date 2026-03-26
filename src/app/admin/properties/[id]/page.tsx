"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { admin } from "@/lib/backend"

export default function PropertyManagePage() {
  const params = useParams() as { id?: string }
  const propertyId = Number(params?.id || 0)

  const [error, setError] = useState("")
  const [suites, setSuites] = useState<any[]>([])
  const [busySuiteId, setBusySuiteId] = useState<number | null>(null)
  const [blockName, setBlockName] = useState("")
  const [floorName, setFloorName] = useState("")
  const [floorBlockId, setFloorBlockId] = useState<string>("")
  const [floorLevel, setFloorLevel] = useState<string>("0")
  const [suiteName, setSuiteName] = useState("")
  const [suiteNumber, setSuiteNumber] = useState("")
  const [previewJson, setPreviewJson] = useState<string>(JSON.stringify({ pattern: "simple", start: 1, count: 5, width: 3 }, null, 2))
  const [preview, setPreview] = useState<any>(null)
  const [bulkJson, setBulkJson] = useState<string>(JSON.stringify({ pattern: "simple", start: 1, count: 5, width: 3 }, null, 2))

  useEffect(() => {
    if (propertyId) loadSuites()
  }, [propertyId])

  async function loadSuites() {
    try {
      const items = await admin.listSuitesAdmin(propertyId)
      setSuites(Array.isArray(items) ? items : [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load suites")
    }
  }

  async function onCreateBlock(e: React.FormEvent) {
    e.preventDefault()
    try {
      await admin.createBlock({ property_id: propertyId, name: blockName, sequence: 1 })
      setBlockName("")
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create block")
    }
  }

  async function onCreateFloor(e: React.FormEvent) {
    e.preventDefault()
    try {
      await admin.createFloor({ block_id: Number(floorBlockId), name: floorName, level_index: Number(floorLevel) || 0, sequence: 1 })
      setFloorName("")
      setFloorLevel("0")
      setFloorBlockId("")
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create floor")
    }
  }

  async function onCreateSuite(e: React.FormEvent) {
    e.preventDefault()
    try {
      await admin.createSuite(propertyId, { name: suiteName, number: suiteNumber, property_id: propertyId })
      setSuiteName("")
      setSuiteNumber("")
      await loadSuites()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create suite")
    }
  }

  async function onPreview() {
    setError("")
    try {
      const payload = JSON.parse(previewJson)
      const res = await admin.numberingPreview(propertyId, payload)
      setPreview(res)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Preview failed: check JSON")
    }
  }

  async function onBulkGenerate() {
    setError("")
    try {
      const payload = JSON.parse(bulkJson)
      await admin.bulkGenerateSuites(propertyId, payload)
      await loadSuites()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Bulk generate failed: check JSON")
    }
  }

  async function onPublishSuite(suiteId: number) {
    setBusySuiteId(suiteId)
    setError("")
    try {
      await admin.publishSuite(propertyId, suiteId)
      await loadSuites()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to publish suite")
    } finally {
      setBusySuiteId(null)
    }
  }

  async function onUnpublishSuite(suiteId: number) {
    setBusySuiteId(suiteId)
    setError("")
    try {
      await admin.unpublishSuite(propertyId, suiteId)
      await loadSuites()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to unpublish suite")
    } finally {
      setBusySuiteId(null)
    }
  }

  if (!propertyId) return <section className="section-container py-10">Invalid property id</section>

  return (
    <section className="section-container py-10 space-y-8">
      <h1 className="text-3xl font-heading font-bold">Property #{propertyId}</h1>
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Blocks</h2>
          <form onSubmit={onCreateBlock} className="flex gap-2">
            <input className="border rounded px-3 py-2" value={blockName} onChange={(e)=>setBlockName(e.target.value)} placeholder="Block name" required />
            <button className="px-3 py-2 border rounded">Create</button>
          </form>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Floors</h2>
          <form onSubmit={onCreateFloor} className="flex gap-2">
            <input className="border rounded px-3 py-2" value={floorName} onChange={(e)=>setFloorName(e.target.value)} placeholder="Floor name" required />
            <input className="border rounded px-3 py-2 w-24" value={floorLevel} onChange={(e)=>setFloorLevel(e.target.value)} placeholder="Level" />
            <input className="border rounded px-3 py-2 w-32" value={floorBlockId} onChange={(e)=>setFloorBlockId(e.target.value)} placeholder="Block ID" required />
            <button className="px-3 py-2 border rounded">Create</button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Create Suite</h2>
          <form onSubmit={onCreateSuite} className="flex gap-2">
            <input className="border rounded px-3 py-2" value={suiteName} onChange={(e)=>setSuiteName(e.target.value)} placeholder="Suite name" required />
            <input className="border rounded px-3 py-2" value={suiteNumber} onChange={(e)=>setSuiteNumber(e.target.value)} placeholder="Number" required />
            <button className="px-3 py-2 border rounded">Create</button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Numbering Preview</h2>
          <div className="grid gap-2">
            <textarea className="border rounded p-2 h-40 font-mono text-sm" value={previewJson} onChange={(e)=>setPreviewJson(e.target.value)} />
            <div className="flex gap-2">
              <button className="px-3 py-2 border rounded" onClick={onPreview} type="button">Preview</button>
              <button className="px-3 py-2 border rounded" onClick={onBulkGenerate} type="button">Bulk generate</button>
            </div>
            {preview && <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">{JSON.stringify(preview, null, 2)}</pre>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Suites</h2>
        <div className="grid gap-2">
          {suites.map((s)=> (
            <div key={s.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-gray-500">{s.number}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded" onClick={()=>onPublishSuite(s.id)} disabled={busySuiteId===s.id}>Publish</button>
                <button className="px-3 py-1 border rounded" onClick={()=>onUnpublishSuite(s.id)} disabled={busySuiteId===s.id}>Unpublish</button>
              </div>
            </div>
          ))}
          {suites.length === 0 && <p className="text-gray-500">No suites.</p>}
        </div>
      </div>
    </section>
  )
}
