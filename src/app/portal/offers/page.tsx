"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { fastAPI, Offer } from "@/lib/fastapi"

function PortalNav() {
  const items = [
    { href: "/portal/offers", label: "Offers" },
    { href: "/portal/invoices", label: "Invoices" },
    { href: "/portal/documents", label: "Documents" },
    { href: "/portal/payments", label: "Payments" },
  ]
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            it.href === "/portal/offers" ? "bg-accent text-white" : "border hover:bg-neutral-50 dark:hover:bg-neutral-800"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </div>
  )
}

export default function PortalOffersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      if (!isAuthenticated) return
      try {
        const data = await fastAPI.getMyOffers()
        setOffers(data || [])
      } catch (e: any) {
        setError(e?.message || "Failed to load offers")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated])

  if (authLoading || loading) {
    return (
      <section className="section-container py-10">
        <h1 className="text-3xl font-heading font-bold mb-6">My Offers</h1>
        <PortalNav />
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section className="section-container py-10">
      <h1 className="text-3xl font-heading font-bold mb-6">My Offers</h1>
      <PortalNav />
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {offers.length === 0 ? (
        <div className="text-center py-10 text-text/60">
          <p>No offers found.</p>
          <p className="text-sm mt-2">Contact us to discuss property opportunities.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/portal/offers/${offer.id}`}
              className="border rounded-xl p-6 bg-white dark:bg-neutral-900 hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-lg">{offer.name}</p>
                  <p className="text-sm text-text/60 mt-1">Property: {offer.property_name || "—"}</p>
                  <p className="text-sm text-text/60">Suite: {offer.suite_name || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-xl">
                    {offer.currency || ""} {Math.round(offer.price_total || 0).toLocaleString()}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    offer.state === "sale"
                      ? "bg-green-100 text-green-700"
                      : offer.state === "cancel"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {offer.state === "sale" ? "Confirmed" : offer.state === "cancel" ? "Cancelled" : "Draft"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
