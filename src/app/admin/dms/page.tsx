"use client"

import { useEffect, useState } from "react"
import { dms } from "@/lib/backend"

export default function AdminDmsPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedWs, setSelectedWs] = useState<number | undefined>(undefined)
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>(undefined)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadWorkspaces()
  }, [])

  useEffect(() => {
    if (selectedWs) loadFolders(selectedWs)
  }, [selectedWs])

  useEffect(() => {
    loadDocuments()
  }, [selectedFolder])

  async function loadWorkspaces() {
    try {
      const items = await dms.listWorkspaces()
      setWorkspaces(items)
      if (items?.length && selectedWs === undefined) setSelectedWs(items[0].id)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load workspaces")
    }
  }

  async function loadFolders(wsId: number) {
    try {
      const items = await dms.listFolders({ workspace_id: wsId })
      setFolders(items)
      // reset selected folder
      setSelectedFolder(undefined)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load folders")
    }
  }

  async function loadDocuments() {
    try {
      const res = await dms.listDocuments({ folder_id: selectedFolder })
      setDocuments(res?.documents || [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load documents")
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      await dms.upload(file, { folder_id: selectedFolder })
      await loadDocuments()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Upload failed")
    } finally {
      setUploading(false)
      e.currentTarget.value = ""
    }
  }

  async function onMove(docId: number, newFolderId?: number) {
    try {
      await dms.move(docId, newFolderId)
      await loadDocuments()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Move failed")
    }
  }

  return (
    <section className="section-container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">DMS</h1>
        <div className="flex gap-2">
          <select className="border rounded px-2 py-1" value={selectedWs || ""} onChange={(e)=>setSelectedWs(Number(e.target.value)||undefined)}>
            <option value="">Select Workspace</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select className="border rounded px-2 py-1" value={selectedFolder || ""} onChange={(e)=>setSelectedFolder(Number(e.target.value)||undefined)}>
            <option value="">All Folders</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <label className="px-3 py-2 border rounded cursor-pointer">
            <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
            {uploading ? "Uploading..." : "Upload"}
          </label>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid gap-3">
        {documents.map((d) => (
          <div key={d.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-xs text-gray-500">{Math.round((d.size||0)/1024)} KB • {d.content_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <a className="px-3 py-1 border rounded" href={`/admin/dms/${d.id}`}>Details</a>
              <a className="px-3 py-1 border rounded" href={d.download_url} target="_blank">Download</a>
              <select className="border rounded px-2 py-1" onChange={(e)=>onMove(d.id, Number(e.target.value)||undefined)} defaultValue="">
                <option value="">Move to...</option>
                {folders.map((f)=> (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {documents.length === 0 && <p>No documents.</p>}
      </div>
    </section>
  )
}
