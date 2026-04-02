import axios from "axios"

// Remote Odoo server - hardcoded to ensure correct connection
const BASE_URL = "https://www.hommesestates.com:8072"
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
  // Using /api/odoo/api/properties which is the correct endpoint on remote server
  listProperties: async () => (await axios.get(`${BASE_URL}/api/properties`, { withCredentials: false })).data,
  listPropertiesAdmin: async () => {
    // Use the same logic as publicApi.listProperties for consistency
    return await publicApi.listProperties()
  },
  createProperty: async (payload: any) => (await client.post("/properties", payload)).data,
  publishProperty: async (propertyId: number) => (await client.post(`/properties/${propertyId}/publish`)).data,
  unpublishProperty: async (propertyId: number) => (await client.post(`/properties/${propertyId}/unpublish`)).data,
  // Get property detail with blocks and floors from remote Odoo
  getPropertyDetail: async (propertyId: number) => {
    const response = await axios.get(`${BASE_URL}/api/properties/${propertyId}`, {
      withCredentials: false
    })
    return response.data?.record || response.data?.data || response.data
  },
  
  // Get blocks for a property
  getBlocks: async (propertyId: number) => {
    const response = await axios.get(`${BASE_URL}/api/properties/${propertyId}`, {
      withCredentials: false
    })
    const data = response.data?.record || response.data?.data || response.data
    return data?.blocks || []
  },
  
  // Get floors for a block
  getFloors: async (blockId: number) => {
    const response = await axios.get(`${BASE_URL}/api/property/block/${blockId}/floors`, {
      withCredentials: false
    })
    return response.data?.floors || response.data?.data?.floors || []
  },
  createSuite: async (propertyId: number, payload: any) => (await client.post(`/properties/${propertyId}/suites`, payload)).data,
  // Get suites for a property
  listSuites: async (propertyId: number) => {
    const response = await axios.get(`${BASE_URL}/api/suites`, {
      withCredentials: false,
      params: { property_id: propertyId }
    })
    return response.data?.records || response.data?.data?.records || response.data || []
  },
  listSuitesAdmin: async (propertyId: number) => {
    // Use the same logic as publicApi.listPropertySuites for consistency
    return await publicApi.listPropertySuites(propertyId)
  },
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

const BACKEND_PROXY_BASE = "/api/backend/proxy"
const ODOO_API_URL = process.env.NEXT_PUBLIC_ODOO_API_URL || process.env.ODOO_API_URL
const hasOdoo = !!ODOO_API_URL
let backendProxyUsable: boolean | null = null

const extractRecords = (data: any): any[] => {
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.data?.records)) return data.data.records
  if (Array.isArray(data)) return data
  return []
}

const extractRecord = (data: any): any => {
  if (data?.record) return data.record
  if (data?.data) return data.data
  return data
}

const shouldDisableBackendProxy = (error: any): boolean => {
  const status = Number(error?.response?.status || 0)
  if (!status) return true
  return status >= 500
}

const backendProxyGet = async (path: string, config?: any) => {
  if (backendProxyUsable === false) return null
  try {
    const response = await axios.get(`${BACKEND_PROXY_BASE}${path}`, {
      withCredentials: false,
      ...(config || {}),
    })
    backendProxyUsable = true
    return response
  } catch (error: any) {
    if (shouldDisableBackendProxy(error)) backendProxyUsable = false
    throw error
  }
}

const normalizePropertyDetail = (property: any) => {
  if (!property) return null
  const images = Array.isArray(property?.images)
    ? property.images.map((image: any, index: number) => {
        if (typeof image === 'string') return { id: index, url: image }
        if (image?.url) return image
        if (image?.image_url) return { ...image, url: image.image_url }
        return image
      })
    : []

  return {
    ...property,
    description: property?.description || property?.summary || '',
    city: property?.city || property?.location || '',
    state: property?.state || '',
    main_image_url: property?.main_image_url || property?.image_url || '',
    images,
  }
}

const fetchSuitesViaProjectExplorer = async (propertyId: number) => {
  const projectResponse = await axios.post(
    `/api/odoo/api/real.estate.project`,
    { slug: String(propertyId) },
    {
      withCredentials: false,
      headers: { 'Content-Type': 'application/json' },
    }
  )

  const blocks = Array.isArray(projectResponse?.data?.blocks) ? projectResponse.data.blocks : []
  if (!blocks.length) return []

  const floorResponses = await Promise.all(
    blocks.map(async (block: any) => {
      try {
        const response = await axios.get(`/api/odoo/api/property/block/${block.id}/floors`, {
          withCredentials: false,
        })
        return Array.isArray(response?.data?.floors)
          ? response.data.floors.map((floor: any) => ({ ...floor, block_id: block.id, block_name: block.name }))
          : []
      } catch {
        return []
      }
    })
  )

  const floors = floorResponses.flat()
  if (!floors.length) return []

  const suiteResponses = await Promise.all(
    floors.map(async (floor: any) => {
      try {
        const response = await axios.get(`/api/odoo/api/property/floor/${floor.id}/details`, {
          withCredentials: false,
        })
        const suites = Array.isArray(response?.data?.suites) ? response.data.suites : []
        return suites.map((suite: any) => ({
          ...suite,
          suite_number: suite?.suite_number || suite?.name || '',
          suite_type: suite?.suite_type || suite?.type_name || 'other',
          type: suite?.type || suite?.type_name || suite?.suite_type || 'other',
          size_sqm: suite?.size_sqm ?? suite?.area ?? suite?.size ?? 0,
          price: suite?.price ?? suite?.list_price ?? 0,
          list_price: suite?.list_price ?? suite?.price ?? 0,
          floor: floor?.floor_name || floor?.name || '',
          block: floor?.block_name || '',
          property_id: propertyId,
        }))
      } catch {
        return []
      }
    })
  )

  return suiteResponses.flat()
}

export const publicApi = {
  listProperties: async () => {
    if (hasOdoo) {
      try {
        const r = await axios.get(`/api/odoo/api/properties`, {
          params: { limit: 50 },
          withCredentials: false,
        })
        const out = extractRecords(r.data)
        if (out.length > 0) return out
      } catch {}
      try {
        const r = await axios.get(`/api/odoo/api/real.estate.property`, {
          params: { limit: 50 },
          withCredentials: false,
        })
        const out = extractRecords(r.data)
        if (out.length > 0) return out
      } catch {}
    }
    try {
      const r = await backendProxyGet(`/properties`, {
        params: { limit: 50 },
      })
      const out = extractRecords(r?.data)
      if (out.length > 0) return out
    } catch {}
    try {
      const r = await client.get('/properties', { params: { limit: 50 } })
      return extractRecords(r.data)
    } catch (e: any) {
      return []
    }
  },
  getProperty: async (propertyId: number) => {
    if (hasOdoo) {
      try {
        const r = await axios.get(`/api/odoo/api/properties/${propertyId}`, {
          withCredentials: false,
        })
        const record = normalizePropertyDetail(extractRecord(r.data))
        if (record) return record
      } catch {}
    }
    try {
      const r = await backendProxyGet(`/properties/${propertyId}`)
      const record = normalizePropertyDetail(extractRecord(r?.data))
      if (record) return record
    } catch {}
    try {
      const r = await client.get(`/properties/${propertyId}`)
      const record = normalizePropertyDetail(extractRecord(r.data))
      if (record) return record
    } catch {}
    try {
      const list = await publicApi.listProperties()
      const match = (Array.isArray(list) ? list : []).find((item: any) => Number(item?.id) === Number(propertyId))
      return normalizePropertyDetail(match)
    } catch {}
    return null
  },
  listPropertySuites: async (propertyId: number) => {
    if (hasOdoo) {
      try {
        const r = await axios.get(`/api/odoo/api/suites`, {
          params: { property_id: propertyId },
          withCredentials: false,
        })
        const out = extractRecords(r.data)
        if (out.length > 0) return out
      } catch {}
      try {
        const out = await fetchSuitesViaProjectExplorer(propertyId)
        if (out.length > 0) return out
      } catch {}
    }
    try {
      const r = await backendProxyGet(`/properties/${propertyId}/suites`)
      const out = extractRecords(r?.data)
      if (out.length > 0) return out
    } catch {}
    try {
      const r = await client.get(`/properties/${propertyId}/suites`)
      return extractRecords(r.data)
    } catch {
      return []
    }
  },
  getFloorLayout: async (floorId: number) => {
    if (hasOdoo) {
      try {
        const r = await axios.get(`/api/odoo/api/floor-layout/${floorId}`, {
          withCredentials: false,
        })
        if (r.data) return r.data
      } catch {}
    }
    // Fallback: return suites with layout positions
    try {
      const suites = await publicApi.listPropertySuites(0)
      const floorSuites = suites.filter((s: any) => s.floor_id === floorId)
      return {
        floor_id: floorId,
        suites: floorSuites.map((s: any) => ({
          id: s.id,
          suite_number: s.suite_number,
          name: s.name,
          status: s.status,
          size_sqm: s.size_sqm,
          price: s.price,
          col_start: s.layout_col_start || s.col_start,
          col_span: s.layout_col_span || s.col_span,
          row_start: s.layout_row_start || s.row_start,
          row_span: s.layout_row_span || s.row_span,
          rotation: s.layout_rotation || s.rotation,
        })),
      }
    } catch {
      return null
    }
  },
  saveFloorLayout: async (floorId: number, placements: any[]) => {
    // This would save to the backend
    // For now, return success
    return { success: true, floor_id: floorId, count: placements.length }
  },
}
