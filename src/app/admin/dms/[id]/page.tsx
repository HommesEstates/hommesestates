"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { dms } from "@/lib/backend"

export default function DmsDocumentDetailsPage() {
  const params = useParams() as { id?: string }
  const docId = Number(params?.id || 0)

  const [tags, setTags] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [shares, setShares] = useState<any[]>([])
  const [newTagId, setNewTagId] = useState<string>("")
  const [commentBody, setCommentBody] = useState<string>("")
  const [creatingShare, setCreatingShare] = useState(false)
  const [shareMinutes, setShareMinutes] = useState<string>("60")
  const [sharePassword, setSharePassword] = useState<string>("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (docId) refresh()
  }, [docId])

  async function refresh() {
    setError("")
    try {
      const [t, c, v, s] = await Promise.all([
        dms.listDocTags(docId),
        dms.listComments(docId, { limit: 50, offset: 0 }),
        dms.listVersions(docId),
        dms.listShares(docId),
      ])
      setTags(t || [])
      setComments((c?.comments) || c || [])
      setVersions(v || [])
      setShares(s || [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load document details")
    }
  }

  async function onAddTag() {
    const id = Number(newTagId)
    if (!id) return
    try {
      await dms.addDocTag(docId, id)
      setNewTagId("")
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to add tag")
    }
  }

  async function onRemoveTag(tagId: number) {
    try {
      await dms.removeDocTag(docId, tagId)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to remove tag")
    }
  }

  async function onAddComment() {
    if (!commentBody.trim()) return
    try {
      await dms.addComment(docId, commentBody)
      setCommentBody("")
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to add comment")
    }
  }

  async function onUploadVersion(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await dms.addVersion(docId, file)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to upload version")
    } finally {
      e.currentTarget.value = ""
    }
  }

  async function onRestoreVersion(versionId: number) {
    try {
      await dms.restoreVersion(docId, versionId)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to restore version")
    }
  }

  async function onCreateShare() {
    setCreatingShare(true)
    try {
      const minutes = Number(shareMinutes) || undefined
      await dms.createShare(docId, { expire_minutes: minutes, password: sharePassword || undefined })
      setSharePassword("")
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create share")
    } finally {
      setCreatingShare(false)
    }
  }

  async function onRevokeShare(shareId: number) {
    try {
      await dms.revokeShare(shareId)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to revoke share")
    }
  }

  if (!docId) return <section className="section-container py-10">Invalid document id</section>

  return (
    <section className="section-container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold">Document #{docId}</h1>
        <a className="px-3 py-2 border rounded" href={`/documents/${docId}/download`} target="_blank">Download</a>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Tags</h2>
          <div className="flex gap-2 mb-2">
            <input className="border rounded px-2 py-1" value={newTagId} onChange={(e)=>setNewTagId(e.target.value)} placeholder="Tag ID" />
            <button className="px-3 py-1 border rounded" onClick={onAddTag}>Add</button>
          </div>
          <ul className="list-disc pl-5">
            {tags.map((t: any) => (
              <li key={t.id} className="flex items-center justify-between">
                <span>{t.name || `Tag #${t.id}`}</span>
                <button className="text-red-600" onClick={()=>onRemoveTag(t.id)}>remove</button>
              </li>
            ))}
            {tags.length === 0 && <li className="list-none text-gray-500">No tags</li>}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Comments</h2>
          <div className="flex gap-2 mb-2">
            <input className="border rounded px-2 py-1 flex-1" value={commentBody} onChange={(e)=>setCommentBody(e.target.value)} placeholder="Write a comment" />
            <button className="px-3 py-1 border rounded" onClick={onAddComment}>Post</button>
          </div>
          <div className="space-y-2">
            {comments.map((c: any) => (
              <div key={c.id} className="border rounded p-2">
                <p className="text-sm">{c.body || c.text || JSON.stringify(c)}</p>
                <p className="text-xs text-gray-500">By {c.author || c.user || "user"} • {c.created_at || c.created || ""}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-gray-500">No comments</p>}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Versions</h2>
          <label className="px-3 py-1 border rounded inline-block mb-2 cursor-pointer">
            <input type="file" className="hidden" onChange={onUploadVersion} />
            Upload new version
          </label>
          <div className="space-y-2">
            {versions.map((v: any) => (
              <div key={v.id} className="border rounded p-2 flex items-center justify-between">
                <div>
                  <p className="text-sm">Version #{v.id}</p>
                  <p className="text-xs text-gray-500">{Math.round((v.size||0)/1024)} KB • {v.content_type}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border rounded" onClick={()=>onRestoreVersion(v.id)}>Restore</button>
                </div>
              </div>
            ))}
            {versions.length === 0 && <p className="text-gray-500">No versions</p>}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Shares</h2>
          <div className="flex items-end gap-2 mb-3">
            <div>
              <label className="text-xs block">Expire (minutes)</label>
              <input className="border rounded px-2 py-1 w-28" value={shareMinutes} onChange={(e)=>setShareMinutes(e.target.value)} />
            </div>
            <div>
              <label className="text-xs block">Password (optional)</label>
              <input className="border rounded px-2 py-1" value={sharePassword} onChange={(e)=>setSharePassword(e.target.value)} />
            </div>
            <button disabled={creatingShare} className="px-3 py-1 bg-copper-gradient text-white rounded disabled:opacity-60" onClick={onCreateShare}>{creatingShare?"Creating...":"Create share"}</button>
          </div>
          <div className="space-y-2">
            {shares.map((s: any) => (
              <div key={s.id} className="border rounded p-2 flex items-center justify-between">
                <div>
                  <p className="text-sm">Share #{s.id}</p>
                  <p className="text-xs text-gray-500">Token: {s.token}</p>
                </div>
                <div className="flex gap-2">
                  <a className="px-3 py-1 border rounded" href={`/documents/share/${s.token}`} target="_blank">Open link</a>
                  <button className="px-3 py-1 border rounded text-red-600" onClick={()=>onRevokeShare(s.id)}>Revoke</button>
                </div>
              </div>
            ))}
            {shares.length === 0 && <p className="text-gray-500">No shares</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
