"use client"

import { useEffect, useMemo, useState } from "react"
import { getKpis, admin } from "@/lib/backend"

export default function BackendDashboard() {
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [days, setDays] = useState<number>(30)
  const [properties, setProperties] = useState<any[]>([])
  const [propertyId, setPropertyId] = useState<number | undefined>(undefined)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await getKpis({ days, property_id: propertyId })
        setData(res)
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Failed to load KPIs")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [days, propertyId])

  useEffect(() => {
    async function loadProps() {
      try {
        const items = await admin.listProperties()
        setProperties(items || [])
      } catch {}
    }
    loadProps()
  }, [])

  const offersTrend = useMemo(() => (data?.trends?.offers_per_day || []), [data])
  const paymentsTrend = useMemo(() => (data?.trends?.payments_per_day || []), [data])

  return (
    <section className="section-container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">Backend Dashboard</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm">Days</label>
          <select className="border rounded px-2 py-1" value={days} onChange={(e)=>setDays(Number(e.target.value))}>
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
          </select>
          <label className="text-sm ml-4">Property</label>
          <select className="border rounded px-2 py-1" value={propertyId || ""} onChange={(e)=>setPropertyId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">All</option>
            {properties.map((p)=> (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {data && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard title="Properties" value={data.properties} />
            <StatCard title="Suites" value={data.suites} />
            <StatCard title="Available" value={data.suites_available} />
            <StatCard title="Unavailable" value={data.suites_unavailable} />
          </div>

          <div>
            <h2 className="font-semibold mb-2">Offers by state</h2>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(data.offers_by_state, null, 2)}</pre>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Invoices</h2>
            <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(data.invoices, null, 2)}</pre>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Payments posted</h2>
            <div className="border rounded p-3">{data.payments_posted}</div>
          </div>

          <TrendChart title="Offers per day" items={offersTrend} valueKey="count" />
          <TrendChart title="Payments per day" items={paymentsTrend} valueKey="count" />
        </div>
      )}
    </section>
  )
}

function StatCard({ title, value }: { title: string, value: any }) {
  return (
    <div className="border rounded p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

function TrendChart({ title, items, valueKey }: { title: string; items: any[]; valueKey: string }) {
  const max = Math.max(1, ...items.map((i)=> Number(i[valueKey])||0))
  return (
    <div>
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="flex items-end gap-1 h-40 border rounded p-2 overflow-x-auto">
        {items.map((i, idx) => {
          const val = Number(i[valueKey])||0
          const height = Math.max(4, Math.round((val / max) * 140))
          return (
            <div key={idx} className="bg-copper-gradient" style={{ width: 12, height }} title={`${(i.date ?? i[0]) || ""}: ${val}`} />
          )
        })}
      </div>
    </div>
  )
}
