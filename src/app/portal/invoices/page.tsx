"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { odooAPI } from "@/lib/api"

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
export default function PortalInvoicesPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")
      try {
        let partnerId: number | null = null
        try { const auth = JSON.parse(localStorage.getItem('odoo_auth') || 'null'); partnerId = auth?.partner_id || null } catch {}
        if (!partnerId) throw new Error('Please login')
        const data = await odooAPI.customerInvoices(partnerId)
        setRows(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError("Failed to load invoices. Please login.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const portalHref = (url: string): string => {
    if (!url) return ""
    if (/^https?:\/\//i.test(url)) return url
    return `/api/odoo${url}`
  }

  return (
    <section className="section-container py-10">
      <h1 className="text-3xl font-heading font-bold mb-6">My Invoices</h1>
      <PortalNav />
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="space-y-4">
        {rows.map((inv) => (
          <div key={inv.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{inv.name || `Invoice #${inv.id}`}</p>
              <p className="text-sm text-gray-500">Amount: {inv.currency || ''} {Math.round(inv.amount_total || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Residual: {inv.currency || ''} {Math.round(inv.amount_residual || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">Status: {inv.state} • Payment: {inv.payment_state}</p>
            </div>
            <div className="text-right">
              {inv.portal_url ? (
                <a className="px-4 py-2 border rounded inline-block" href={portalHref(inv.portal_url)} target="_blank">Pay on Portal</a>
              ) : (
                <span className="text-sm text-gray-500">No portal link</span>
              )}
            </div>
          </div>
        ))}
        {!loading && rows.length === 0 && <p>No invoices found.</p>}
      </div>
    </section>
  )
}
