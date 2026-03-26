"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { fastAPI, Payment } from "@/lib/fastapi"

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

export default function PortalPaymentsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [records, setRecords] = useState<Payment[]>([])

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) return
      
      setLoading(true)
      setError("")
      try {
        const data = await fastAPI.getMyPayments()
        setRecords(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError("Failed to load payments. Please login.")
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      load()
    }
  }, [isAuthenticated, authLoading])

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
        <h1 className="text-3xl font-heading font-bold mb-6">My Payments</h1>
        <p>Please <Link className="text-accent underline" href="/login">login</Link> to view your payments.</p>
      </section>
    )
  }

  return (
    <section className="section-container py-10">
      <h1 className="text-3xl font-heading font-bold mb-6">My Payments</h1>
      <PortalNav />
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      
      <div className="space-y-6">
        {records.map((r) => (
          <div key={r.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Payment #{r.id}</p>
                <p className="text-sm text-gray-500">Date: {r.date}</p>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                  r.state === 'posted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {r.state.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-xl font-bold">{r.currency || '₦'}{(r.amount || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {!loading && records.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No payments found.</p>
          </div>
        )}
      </div>
    </section>
  )
}
