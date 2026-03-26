"use client"

import { useEffect, useState } from "react"
import { admin } from "@/lib/backend"

export default function AdminOffersPage() {
  const [partnerId, setPartnerId] = useState<string>("")
  const [suiteId, setSuiteId] = useState<string>("")
  const [priceTotal, setPriceTotal] = useState<string>("")
  const [code, setCode] = useState<string>("")
  const [validityDate, setValidityDate] = useState<string>("")
  const [created, setCreated] = useState<any | null>(null)
  const [error, setError] = useState<string>("")
  const [busy, setBusy] = useState(false)

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setBusy(true)
    try {
      const payload: any = {
        partner_id: Number(partnerId),
        suite_id: Number(suiteId),
        price_total: Number(priceTotal),
        code: code || undefined,
        validity_date: validityDate || undefined,
      }
      const offer = await admin.createOffer(payload)
      setCreated(offer)
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to create offer")
    } finally {
      setBusy(false)
    }
  }

  async function act(kind: "confirm"|"cancel") {
    if (!created?.id) return
    setBusy(true)
    try {
      const result = kind === "confirm" ? await admin.confirmOffer(created.id) : await admin.cancelOffer(created.id)
      setCreated(result)
    } catch (e: any) {
      setError(e?.response?.data?.detail || `Failed to ${kind} offer`)
    } finally {
      setBusy(false)
    }
  }

  async function genDoc(kind: "offer_letter"|"payment_summary"|"allocation") {
    if (!created?.id) return
    setBusy(true)
    try {
      const r = await admin.generateOfferDoc(created.id, kind)
      const url = r?.document?.download_url
      if (url) window.open(url, "_blank")
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to generate document")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section-container py-10 space-y-6">
      <h1 className="text-3xl font-heading font-bold">Offers</h1>
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={onCreate} className="grid md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm">Partner ID</label>
          <input className="border rounded px-3 py-2 w-full" value={partnerId} onChange={(e)=>setPartnerId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Suite ID</label>
          <input className="border rounded px-3 py-2 w-full" value={suiteId} onChange={(e)=>setSuiteId(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Price Total</label>
          <input className="border rounded px-3 py-2 w-full" value={priceTotal} onChange={(e)=>setPriceTotal(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Code (optional)</label>
          <input className="border rounded px-3 py-2 w-full" value={code} onChange={(e)=>setCode(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Validity Date (YYYY-MM-DD)</label>
          <input className="border rounded px-3 py-2 w-full" value={validityDate} onChange={(e)=>setValidityDate(e.target.value)} />
        </div>
        <div className="md:col-span-5">
          <button className="px-4 py-2 bg-copper-gradient text-white rounded disabled:opacity-60" disabled={busy}>{busy?"Working...":"Create Offer"}</button>
        </div>
      </form>

      {created && (
        <div className="border rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Offer #{created.id} — {created.state}</p>
              <p className="text-xs text-gray-500">Total: ₦{Math.round(created.price_total || 0).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={()=>act("confirm")} disabled={busy}>Confirm</button>
              <button className="px-3 py-1 border rounded" onClick={()=>act("cancel")} disabled={busy}>Cancel</button>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded" onClick={()=>genDoc("offer_letter")} disabled={busy}>Offer Letter</button>
            <button className="px-3 py-1 border rounded" onClick={()=>genDoc("payment_summary")} disabled={busy}>Payment Summary</button>
            <button className="px-3 py-1 border rounded" onClick={()=>genDoc("allocation")} disabled={busy}>Allocation</button>
          </div>
        </div>
      )}
    </section>
  )
}
