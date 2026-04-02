"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { fastAPI, Offer, PaymentSchedule } from "@/lib/fastapi"

function PortalNav() {
  const pathname = useParams().id ? `/portal/offers/${useParams().id}` : "/portal/offers"
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

export default function OfferDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [offer, setOffer] = useState<Offer | null>(null)
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [signing, setSigning] = useState(false)
  const [signatureData, setSignatureData] = useState("")

  useEffect(() => {
    async function load() {
      if (!isAuthenticated || !id) return
      
      setLoading(true)
      setError("")
      try {
        const offerData = await fastAPI.getMyOffer(Number(id))
        if (!offerData) {
          setError("Offer not found")
          return
        }
        setOffer(offerData)
        
        const scheduleData = await fastAPI.getOfferPaymentSchedules(Number(id))
        setSchedules(scheduleData)
      } catch (e: any) {
        setError("Failed to load offer details")
      } finally {
        setLoading(false)
      }
    }
    
    if (!authLoading) {
      load()
    }
  }, [isAuthenticated, authLoading, id])

  const handleSign = async () => {
    if (!signatureData) {
      alert("Please provide your signature")
      return
    }
    
    setSigning(true)
    try {
      const success = await fastAPI.signOffer(Number(id), signatureData)
      if (success) {
        // Refresh offer data
        const offerData = await fastAPI.getMyOffer(Number(id))
        setOffer(offerData)
      } else {
        alert("Failed to sign offer")
      }
    } catch (error) {
      alert("Error signing offer")
    } finally {
      setSigning(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    const symbols: Record<string, string> = { NGN: "₦", USD: "$", EUR: "€", GBP: "£" }
    return `${symbols[currency] || currency}${amount.toLocaleString()}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      sale: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      partial: "bg-orange-100 text-orange-800",
      overdue: "bg-red-100 text-red-800",
    }
    return styles[status] || "bg-gray-100 text-gray-800"
  }

  if (authLoading || loading) {
    return (
      <section className="section-container py-10">
        <div className="animate-pulse">Loading...</div>
      </section>
    )
  }

  if (!isAuthenticated) {
    return (
      <section className="section-container py-10">
        <h1 className="text-3xl font-heading font-bold mb-6">Offer Details</h1>
        <p>Please <Link className="text-accent underline" href="/login">login</Link> to view this offer.</p>
      </section>
    )
  }

  if (error || !offer) {
    return (
      <section className="section-container py-10">
        <h1 className="text-3xl font-heading font-bold mb-6">Offer Details</h1>
        <PortalNav />
        <p className="text-red-600">{error || "Offer not found"}</p>
        <Link href="/portal/offers" className="text-accent underline mt-4 inline-block">
          ← Back to offers
        </Link>
      </section>
    )
  }

  return (
    <section className="section-container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-heading font-bold">
          {offer.name || `Offer #${offer.id}`}
        </h1>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(offer.state)}`}>
          {offer.state.toUpperCase()}
        </span>
      </div>
      
      <PortalNav />

      {/* Offer Summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Offer Summary</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-semibold">{offer.property_name || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Suite</p>
            <p className="font-semibold">{offer.suite_name || offer.suite_number || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="font-semibold text-2xl gradient-text">
              {formatCurrency(offer.price_total, offer.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full"
                  style={{ width: `${offer.payment_percentage || 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{offer.payment_percentage || 0}%</span>
            </div>
          </div>
          {offer.validity_date && (
            <div>
              <p className="text-sm text-gray-500">Valid Until</p>
              <p className="font-semibold">{formatDate(offer.validity_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Schedules */}
      {schedules.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Schedule</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Due Date</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-right py-3 px-4">Paid</th>
                  <th className="text-right py-3 px-4">Outstanding</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <td className="py-3 px-4">{schedule.description || `Payment ${schedule.id}`}</td>
                    <td className="py-3 px-4">{formatDate(schedule.due_date)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(schedule.amount)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(schedule.paid_amount)}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {formatCurrency(schedule.outstanding_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(schedule.status)}`}>
                        {schedule.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold bg-gray-50 dark:bg-neutral-800">
                  <td colSpan={2} className="py-3 px-4">Total</td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(schedules.reduce((sum, s) => sum + s.amount, 0))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(schedules.reduce((sum, s) => sum + (s.paid_amount || 0), 0))}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(schedules.reduce((sum, s) => sum + (s.outstanding_amount || 0), 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Signature Section (for offers awaiting signature) */}
      {offer.state === "sent" && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sign Offer</h2>
          <p className="text-gray-500 mb-4">
            Please sign below to confirm your acceptance of this offer.
          </p>
          <div className="mb-4">
            <label className="block text-sm mb-2">Your Signature</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-muted dark:bg-neutral-800 border"
              placeholder="Type your full name as signature"
              value={signatureData}
              onChange={(e) => setSignatureData(e.target.value)}
            />
          </div>
          <button
            onClick={handleSign}
            disabled={signing || !signatureData}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
          >
            {signing ? "Signing..." : "Sign & Accept Offer"}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/portal/offers"
          className="px-6 py-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800"
        >
          ← Back to Offers
        </Link>
        {offer.state === "sale" && (
          <Link
            href="/portal/documents"
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            View Documents
          </Link>
        )}
      </div>
    </section>
  )
}
