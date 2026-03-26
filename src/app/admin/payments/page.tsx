"use client"

import { useState } from "react"
import { admin } from "@/lib/backend"

export default function AdminPaymentsPage() {
  const [partnerId, setPartnerId] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("NGN")
  const [date, setDate] = useState("")
  const [state, setState] = useState("posted")
  const [payment, setPayment] = useState<any | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const payload: any = {
        partner_id: Number(partnerId),
        invoice_id: Number(invoiceId),
        amount: Number(amount),
        currency: currency || "NGN",
        date: date || undefined,
        state: state || undefined,
      }
      const res = await admin.createPayment(payload)
      setPayment(res)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create payment")
    } finally {
      setBusy(false)
    }
  }

  async function onAck() {
    if (!payment?.id) return
    setBusy(true)
    setError("")
    try {
      const r = await admin.paymentAck(payment.id)
      const url = r?.document?.download_url
      if (url) window.open(url, "_blank")
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate payment acknowledgement")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-container py-10 space-y-6">
      <h1 className="text-3xl font-heading font-bold">Payments</h1>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm">Partner ID</label>
          <input className="border rounded px-3 py-2 w-full" value={partnerId} onChange={(e)=>setPartnerId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Invoice ID</label>
          <input className="border rounded px-3 py-2 w-full" value={invoiceId} onChange={(e)=>setInvoiceId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Amount</label>
          <input className="border rounded px-3 py-2 w-full" value={amount} onChange={(e)=>setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Currency</label>
          <input className="border rounded px-3 py-2 w-full" value={currency} onChange={(e)=>setCurrency(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Date (YYYY-MM-DD)</label>
          <input className="border rounded px-3 py-2 w-full" value={date} onChange={(e)=>setDate(e.target.value)} />
        </div>
        <div className="md:col-span-5">
          <button className="px-4 py-2 bg-copper-gradient text-white rounded disabled:opacity-60" disabled={busy}>{busy?"Working...":"Create Payment"}</button>
        </div>
      </form>

      {payment && (
        <div className="border rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Payment #{payment.id}</p>
              <p className="text-xs text-gray-500">₦{Math.round(payment.amount || 0).toLocaleString()} on {payment.date || "—"}</p>
            </div>
            <button className="px-3 py-1 border rounded" onClick={onAck} disabled={busy}>Payment Ack</button>
          </div>
        </div>
      )}
    </section>
  )
}
