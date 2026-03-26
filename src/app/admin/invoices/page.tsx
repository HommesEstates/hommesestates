"use client"

import { useEffect, useState } from "react"
import { admin } from "@/lib/backend"

export default function AdminInvoicesPage() {
  const [partnerId, setPartnerId] = useState("")
  const [offerId, setOfferId] = useState("")
  const [currency, setCurrency] = useState("NGN")
  const [amountTotal, setAmountTotal] = useState("")
  const [invoice, setInvoice] = useState<any | null>(null)
  const [schedules, setSchedules] = useState<any[]>([])
  const [dueDate, setDueDate] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [doc, setDoc] = useState<any | null>(null)

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const payload: any = {
        partner_id: Number(partnerId),
        currency: currency || "NGN",
        amount_total: Number(amountTotal),
      }
      if (offerId) payload.offer_id = Number(offerId)
      const inv = await admin.createInvoice(payload)
      setInvoice(inv)
      await loadSchedules(inv?.id)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create invoice")
    } finally {
      setBusy(false)
    }
  }

  async function loadSchedules(invoiceId?: number) {
    const id = invoiceId || invoice?.id
    if (!id) return
    try {
      const data = await admin.getInvoiceSchedules(id)
      setSchedules(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to load schedules")
    }
  }

  async function onAddSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice?.id) return
    setBusy(true)
    setError("")
    try {
      await admin.addSchedule(invoice.id, { due_date: dueDate || undefined, amount: Number(amount) })
      setDueDate("")
      setAmount("")
      await loadSchedules()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to add schedule")
    } finally {
      setBusy(false)
    }
  }

  async function onRecompute() {
    if (!invoice?.id) return
    setBusy(true)
    setError("")
    try {
      const res = await admin.recomputeInvoice(invoice.id)
      setInvoice(res?.invoice || invoice)
      await loadSchedules()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to recompute")
    } finally {
      setBusy(false)
    }
  }

  async function onGeneratePdf() {
    if (!invoice?.id) return
    setBusy(true)
    setError("")
    setDoc(null)
    try {
      const res = await admin.generateInvoicePdf(invoice.id)
      setDoc(res?.document || null)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate invoice PDF")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-container py-10 space-y-6">
      <h1 className="text-3xl font-heading font-bold">Invoices</h1>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm">Partner ID</label>
          <input className="border rounded px-3 py-2 w-full" value={partnerId} onChange={(e)=>setPartnerId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Offer ID (optional)</label>
          <input className="border rounded px-3 py-2 w-full" value={offerId} onChange={(e)=>setOfferId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Currency</label>
          <input className="border rounded px-3 py-2 w-full" value={currency} onChange={(e)=>setCurrency(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Amount Total</label>
          <input className="border rounded px-3 py-2 w-full" value={amountTotal} onChange={(e)=>setAmountTotal(e.target.value)} required />
        </div>
        <div className="md:col-span-5">
          <button className="px-4 py-2 bg-copper-gradient text-white rounded disabled:opacity-60" disabled={busy}>{busy?"Working...":"Create Invoice"}</button>
        </div>
      </form>

      {invoice && (
        <div className="border rounded p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Invoice #{invoice.id}</p>
              <p className="text-xs text-gray-500">Total: ₦{Math.round(invoice.amount_total || 0).toLocaleString()} • Residual: ₦{Math.round(invoice.residual || 0).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border rounded" onClick={onRecompute} disabled={busy}>Recompute</button>
              <button className="px-3 py-1 border rounded" onClick={onGeneratePdf} disabled={busy}>Generate PDF</button>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Add Schedule</h2>
            <form onSubmit={onAddSchedule} className="flex flex-wrap gap-2 items-end">
              <div>
                <label className="block text-sm">Due Date (YYYY-MM-DD)</label>
                <input className="border rounded px-3 py-2" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm">Amount</label>
                <input className="border rounded px-3 py-2" value={amount} onChange={(e)=>setAmount(e.target.value)} required />
              </div>
              <button className="px-3 py-2 border rounded" disabled={busy}>{busy?"Adding...":"Add"}</button>
            </form>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Schedules</h2>
            <div className="border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="text-left p-2">Due</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Paid</th>
                    <th className="text-left p-2">Outstanding</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s)=> (
                    <tr key={s.id} className="border-t">
                      <td className="p-2">{s.due_date || "—"}</td>
                      <td className="p-2">₦{Math.round(s.amount || 0).toLocaleString()}</td>
                      <td className="p-2">₦{Math.round(s.paid_amount || 0).toLocaleString()}</td>
                      <td className="p-2">₦{Math.round(s.outstanding_amount || 0).toLocaleString()}</td>
                      <td className="p-2">{s.status || ""}</td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr><td className="p-2" colSpan={5}>No schedules</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {doc && (
            <div className="pt-2">
              <a href={doc.download_url} className="text-blue-600 underline" target="_blank" rel="noreferrer">Download Invoice PDF</a>
              <span className="ml-2 text-xs text-gray-500">{doc.name} ({Math.round((doc.size||0)/1024)} KB)</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
