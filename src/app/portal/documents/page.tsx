"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { fastAPI, Document } from "@/lib/fastapi"

function PortalNav() {
  const pathname = usePathname()
  const items = [
    { href: "/portal/offers", label: "Offers" },
    { href: "/portal/invoices", label: "Invoices" },
    { href: "/portal/documents", label: "Documents" },
    { href: "/portal/payments", label: "Payments" },
  ]
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={`px-4 py-2 rounded-lg text-sm font-semibold ${pathname === it.href ? 'bg-accent text-white' : 'border hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
          {it.label}
        </Link>
      ))}
    </div>
  )
}

const DOC_TYPE_LABELS: Record<string, string> = {
  offer_letter: "Offer Letter",
  allocation_letter: "Allocation Letter",
  payment_ack: "Payment Acknowledgement",
  invoice: "Invoice",
  contract: "Contract",
  other: "Document",
}

export default function PortalDocumentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [docs, setDocs] = useState<Document[]>([])
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) return
      
      setLoading(true)
      setError("")
      try {
        const data = await fastAPI.getMyDocuments()
        setDocs(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError("Failed to load documents. Please login.")
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      load()
    }
  }, [isAuthenticated, authLoading])

  const handleDownload = async (docId: number) => {
    setDownloadingId(docId)
    try {
      const url = await fastAPI.getDocumentDownloadUrl(docId)
      if (url) {
        // Open in new tab or trigger download
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setDownloadingId(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (authLoading) {
    return (
      <section className="section-container py-10">
        <div className="animate-pulse">Loading...</div>
      </section>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="section-container py-10">
        <h1 className="text-3xl font-heading font-bold mb-6">My Documents</h1>
        <p>Please <Link className="text-accent underline" href="/login">login</Link> to view your documents.</p>
      </section>
    )
  }

  return (
    <section className="section-container py-10">
      <h1 className="text-3xl font-heading font-bold mb-6">My Documents</h1>
      <PortalNav />

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid gap-4">
        {docs.map((d) => (
          <div key={d.id} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="font-semibold">{d.name}</p>
              <div className="flex gap-4 mt-1 text-sm text-gray-500">
                <span>{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</span>
                <span>{formatFileSize(d.size)}</span>
                <span>{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <button
                onClick={() => handleDownload(d.id)}
                disabled={downloadingId === d.id}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
              >
                {downloadingId === d.id ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        ))}
        {!loading && docs.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No documents found.</p>
          </div>
        )}
      </div>
    </section>
  )
}
