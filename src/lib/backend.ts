import axios from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
// Odoo proxy via Next.js rewrites
const ODOO_BASE = "/api/odoo"

let token: string | null = null

export function setToken(t: string | null) {
  token = t
  if (typeof window !== "undefined") {
    if (t) localStorage.setItem("backend_token", t)
    else localStorage.removeItem("backend_token")
  }
}

 

export function getToken(): string | null {
  if (token) return token
  if (typeof window !== "undefined") {
    token = localStorage.getItem("backend_token")
  }
  return token
}

const client = axios.create({
  baseURL: BASE_URL,
})
const odooClient = axios.create({
  baseURL: ODOO_BASE,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const t = getToken()
  if (t) {
    const headers: any = config.headers ?? {}
    headers["Authorization"] = `Bearer ${t}`
    config.headers = headers
  }
  return config
})

export async function login(username: string, password: string) {
  const r = await client.post("/auth/login", { username, password })
  const t = r.data?.access_token as string
  if (t) setToken(t)
  return r.data
}

export async function me() {
  const r = await client.get("/auth/me")
  return r.data
}

export async function getKpis(params?: { days?: number; property_id?: number }) {
  const r = await client.get("/dashboard/kpis", { params })
  return r.data
}

export async function getMyOffers(params?: { limit?: number; offset?: number }) {
  const r = await client.get("/portal/me/offers", { params })
  return r.data
}

export async function getMyPayments(params?: { limit?: number; offset?: number }) {
  const r = await client.get("/portal/me/payments", { params })
  return r.data
}

export async function getMyDocuments(params?: { limit?: number; offset?: number }) {
  const r = await client.get("/portal/me/documents", { params })
  return r.data
}

// Admin/DMS helpers
export const dms = {
  listWorkspaces: async (params?: { limit?: number; offset?: number }) => (await client.get("/dms/workspaces", { params })).data,
  createWorkspace: async (name: string, description?: string) => (await client.post("/dms/workspaces", null, { params: { name, description } })).data,
  listFolders: async (params?: { workspace_id?: number; limit?: number; offset?: number }) => (await client.get("/dms/folders", { params })).data,
  createFolder: async (name: string, opts?: { parent_id?: number; workspace_id?: number }) => (await client.post("/dms/folders", null, { params: { name, ...opts } })).data,
  listTags: async (params?: { limit?: number; offset?: number }) => (await client.get("/dms/tags", { params })).data,
  createTag: async (name: string) => (await client.post("/dms/tags", null, { params: { name } })).data,
  listDocuments: async (params?: { folder_id?: number; partner_id?: number; offer_id?: number; limit?: number; offset?: number }) => (await client.get("/dms/documents", { params })).data,
  upload: async (file: File, opts?: { name?: string; folder_id?: number; partner_id?: number; offer_id?: number; doc_type?: string }) => {
    const fd = new FormData()
    fd.append("file", file)
    const r = await client.post("/dms/documents/upload", fd, { params: opts, headers: { "Content-Type": "multipart/form-data" } })
    return r.data
  },
  move: async (doc_id: number, folder_id?: number) => (await client.post(`/dms/documents/${doc_id}/move`, null, { params: { folder_id } })).data,
  listDocTags: async (doc_id: number) => (await client.get(`/dms/documents/${doc_id}/tags`)).data,
  addDocTag: async (doc_id: number, tag_id: number) => (await client.post(`/dms/documents/${doc_id}/tags`, null, { params: { tag_id } })).data,
  removeDocTag: async (doc_id: number, tag_id: number) => (await client.delete(`/dms/documents/${doc_id}/tags/${tag_id}`)).data,
  listComments: async (doc_id: number, params?: { limit?: number; offset?: number }) => (await client.get(`/dms/documents/${doc_id}/comments`, { params })).data,
  addComment: async (doc_id: number, body: string) => (await client.post(`/dms/documents/${doc_id}/comments`, null, { params: { body } })).data,
  listVersions: async (doc_id: number) => (await client.get(`/dms/documents/${doc_id}/versions`)).data,
  addVersion: async (doc_id: number, file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    return (await client.post(`/dms/documents/${doc_id}/versions`, fd, { headers: { "Content-Type": "multipart/form-data" } })).data
  },
  restoreVersion: async (doc_id: number, version_id: number) => (await client.post(`/dms/documents/${doc_id}/versions/${version_id}/restore`)).data,
  listShares: async (doc_id: number) => (await client.get(`/dms/documents/${doc_id}/shares`)).data,
  createShare: async (doc_id: number, opts?: { expire_minutes?: number; password?: string }) => (await client.post(`/documents/${doc_id}/share`, null, { params: opts })).data,
  revokeShare: async (share_id: number) => (await client.delete(`/dms/shares/${share_id}`)).data,
}

// Real estate admin helpers
export const admin = {
  // Properties / Blocks / Floors / Suites
  listProperties: async () => (await client.get("/properties")).data,
  listPropertiesAdmin: async () => (await client.get("/admin/properties")).data,
  createProperty: async (payload: any) => (await client.post("/properties", payload)).data,
  publishProperty: async (propertyId: number) => (await client.post(`/properties/${propertyId}/publish`)).data,
  unpublishProperty: async (propertyId: number) => (await client.post(`/properties/${propertyId}/unpublish`)).data,
  createBlock: async (payload: any) => (await client.post("/blocks", payload)).data,
  createFloor: async (payload: any) => (await client.post("/floors", payload)).data,
  createSuite: async (propertyId: number, payload: any) => (await client.post(`/properties/${propertyId}/suites`, payload)).data,
  listSuites: async (propertyId: number) => (await client.get(`/properties/${propertyId}/suites`)).data,
  listSuitesAdmin: async (propertyId: number) => (await client.get(`/admin/properties/${propertyId}/suites`)).data,
  publishSuite: async (propertyId: number, suiteId: number) => (await client.post(`/properties/${propertyId}/suites/${suiteId}/publish`)).data,
  unpublishSuite: async (propertyId: number, suiteId: number) => (await client.post(`/properties/${propertyId}/suites/${suiteId}/unpublish`)).data,
  numberingPreview: async (propertyId: number, payload: any) => (await client.post(`/properties/${propertyId}/numbering/preview`, payload)).data,
  bulkGenerateSuites: async (propertyId: number, payload: any) => (await client.post(`/properties/${propertyId}/suites/generate`, payload)).data,

  // Billing: Offers / Invoices / Payments
  createOffer: async (payload: any) => (await client.post("/offers", payload)).data,
  generateOfferDoc: async (offerId: number, kind: "offer_letter"|"payment_summary"|"allocation") => (await client.post(`/offers/${offerId}/documents/${kind}`)).data,
  getOffer: async (offerId: number) => (await client.get(`/offers/${offerId}`)).data,
  confirmOffer: async (offerId: number) => (await client.post(`/offers/${offerId}/confirm`)).data,
  cancelOffer: async (offerId: number) => (await client.post(`/offers/${offerId}/cancel`)).data,
  createInvoice: async (payload: any) => (await client.post("/invoices", payload)).data,
  addSchedule: async (invoiceId: number, payload: any) => (await client.post(`/invoices/${invoiceId}/schedules`, payload)).data,
  recomputeInvoice: async (invoiceId: number) => (await client.post(`/invoices/${invoiceId}/recompute`)).data,
  getInvoiceSchedules: async (invoiceId: number) => (await client.get(`/invoices/${invoiceId}/schedules`)).data,
  getInvoicePaymentSnapshots: async (invoiceId: number) => (await client.get(`/invoices/${invoiceId}/payments/snapshots`)).data,
  createPayment: async (payload: any) => (await client.post("/payments", payload)).data,
  paymentAck: async (paymentId: number) => (await client.post(`/payments/${paymentId}/ack`)).data,
  generateInvoicePdf: async (invoiceId: number) => (await client.post(`/invoices/${invoiceId}/documents/invoice`)).data,
}

// Public (unauthenticated) helpers for site pages
export const publicApi = {
  // Fetch from Odoo REST directly (bypass proxy to avoid auth redirects)
  listProperties: async () => {
    try {
      const r = await axios.get(`/api/odoo/api/properties`, {
        params: { limit: 50 },
        withCredentials: false,
      })
      const d = r.data;
      let out: any[] = [];
      if (Array.isArray(d?.records)) out = d.records;
      else if (Array.isArray(d?.data?.records)) out = d.data.records;
      else if (Array.isArray(d)) out = d;
      if (Array.isArray(out) && out.length) return out;
      const legacy = await axios.get(`/api/odoo/api/real.estate.property`, {
        params: { limit: 50 },
        withCredentials: false,
      })
      const ld = legacy.data;
      if (Array.isArray(ld?.records)) return ld.records;
      if (Array.isArray(ld)) return ld;
      return [];
    } catch (e: any) {
      try {
        const legacy = await axios.get(`/api/odoo/api/real.estate.property`, {
          params: { limit: 50 },
          withCredentials: false,
        })
        const ld = legacy.data;
        if (Array.isArray(ld?.records)) return ld.records;
        if (Array.isArray(ld)) return ld;
      } catch {}
      return [];
    }
  },
  getProperty: async (propertyId: number) => {
    const r = await axios.get(`/api/odoo/api/properties/${propertyId}`, {
      withCredentials: false,
    })
    return r.data;
  },
  listPropertySuites: async (propertyId: number) => {
    const r = await axios.get(`/api/odoo/api/suites`, {
      params: { property_id: propertyId },
      withCredentials: false,
    })
    const d = r.data;
    if (Array.isArray(d?.records)) return d.records;
    if (Array.isArray(d?.data?.records)) return d.data.records;
    if (Array.isArray(d)) return d;
    return [];
  },
}
