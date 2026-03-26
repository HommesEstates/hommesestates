import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { Property, PropertyFilter, Lead, Offer, CMSContent, Testimonial, TeamMember, Statistics } from '@/types'

class OdooAPI {
  private client: AxiosInstance
  private csrfToken?: string
  private odBase = (process.env.NEXT_PUBLIC_ODOO_API_URL || '').replace(/\/$/, '')
  private abs = (url: string): string => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    // Ensure url starts with a single '/'
    const path = url.startsWith('/') ? url : `/${url}`
    // If odBase already ends with path prefix (e.g. http://host:8069/odoo), do not duplicate
    return `${this.odBase}${path}`
  }
  private async ensureCsrf(): Promise<void> {
    if (this.csrfToken) return
    try {
      const { data } = await this.client.get('/web/session/csrf', { withCredentials: true })
      const token = data?.csrf_token || data?.csrf || ''
      if (token) {
        this.csrfToken = token
        // Set both header variants to satisfy different middleware expectations
        ;(this.client.defaults.headers as any)['X-CSRFToken'] = token
        ;(this.client.defaults.headers as any)['X-CSRF-Token'] = token
      }
    } catch (e) {
      try {
        const { data } = await this.client.get('/web/session/csrf_token', { withCredentials: true })
        const token = data?.csrf_token || data || ''
        if (token) {
          this.csrfToken = token
          ;(this.client.defaults.headers as any)['X-CSRFToken'] = token
          ;(this.client.defaults.headers as any)['X-CSRF-Token'] = token
        }
      } catch {}
    }
  }

  async createOfferPublic(payload: { name: string; email: string; phone?: string; street?: string; city?: string; state?: string; country?: string; country_id?: number; state_id?: number; suite_id: number; payment_term_id?: number; note?: string; expires_in_days?: number }): Promise<{ ok: boolean; id?: number; name?: string; portal_url?: string; validity_date?: string } | null> {
    try {
      await this.ensureCsrf()
      const body = { ...(payload as any) }
      if (this.csrfToken && !('csrf_token' in body)) (body as any).csrf_token = this.csrfToken
      const { data } = await this.client.post('/api/offers/create_public', body)
      return data
    } catch (error) {
      return null
    }
  }

  async createOfferDirect(payload: { suite_id: number; payment_term_id?: number; note?: string }): Promise<{ ok: boolean; id?: number; name?: string } | null> {
    try {
      await this.ensureCsrf()
      const body = { ...(payload as any) }
      if (this.csrfToken && !('csrf_token' in body)) (body as any).csrf_token = this.csrfToken
      const { data } = await this.client.post('/api/offers/create', body)
      return data
    } catch (error) {
      return null
    }
  }
  private mapPropertyList = (r: any): Property => {
    const location = [r?.city, r?.state].filter(Boolean).join(', ')
    const status: Property['status'] = (r?.available_suites && r.available_suites > 0) ? 'available' : 'sold'
    const images = r?.main_image_url
      ? [this.abs(r.main_image_url)]
      : (Array.isArray(r?.images) ? r.images.map((i: any) => this.abs(i.url || i.image_url || i.path || '')).filter(Boolean) : [])
    return {
      id: r?.id,
      name: r?.name || '',
      description: r?.description || r?.summary || '',
      property_type: (r?.type || 'commercial'),
      location,
      address: '',
      price: typeof r?.price_from === 'number' ? r.price_from : 0,
      currency: 'NGN',
      area: 0,
      area_unit: 'sqm',
      status,
      images,
      featured: false,
      investment_ready: status === 'available',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    } as Property
  }

  // Full detail (raw) with images, plans, floors, suites
  async getPropertyDetail(id: number): Promise<any | null> {
    try {
      const { data } = await this.client.get(`/api/properties/${id}`)
      if (!data) return null
      // Handle explicit not-found from backend (still 200)
      if (data && data.ok === false) {
        // Try to reconstruct from other endpoints so the page still renders
        const fallback: any = { id }
        try {
          // Find basic info from list
          const listRes = await this.client.get('/api/properties', { params: { limit: 200 } })
          const recs = Array.isArray(listRes?.data?.records) ? listRes.data.records : []
          const found = recs.find((r: any) => Number(r?.id) === Number(id))
          if (found) {
            fallback.name = found.name
            fallback.city = found.city
            fallback.state = found.state
            fallback.type = found.type
            fallback.available_suites = found.available_suites
            fallback.total_suites = found.total_suites
            fallback.main_image_url = found.main_image_url
          }
        } catch {}
        try {
          const media = await this.getPropertyImages(id)
          if (Array.isArray(media) && media.length) {
            fallback.images = media.map((m: any) => ({ id: m.id, url: this.abs(m.url || m.image_url || m.path || '') }))
          }
        } catch {}
        try {
          const suites = await this.getSuites(id)
          if (Array.isArray(suites)) {
            fallback.suites = suites
            const prices = suites.filter((s: any) => s.is_available !== false).map((s: any) => Number(s.price || 0)).filter((n: number) => n > 0)
            if (prices.length) fallback.price_from = Math.min(...prices)
          }
        } catch {}
        // If we at least have a name or images/suites, return fallback, else null
        if (fallback.name || fallback.images || fallback.suites) return fallback
        return null
      }
      const payload = (data && (data.record || data.data)) ? (data.record || data.data) : data

      // Normalize main image
      if (payload.main_image_url) payload.main_image_url = this.abs(payload.main_image_url)

      // Ensure images array
      if (Array.isArray(payload.images)) {
        payload.images = payload.images
          .map((i: any) => {
            const url = i?.url || i?.image_url || i?.path || ''
            return url ? { ...i, url: this.abs(url) } : null
          })
          .filter(Boolean)
      } else {
        // Fallback: fetch media images
        try {
          const media = await this.getPropertyImages(id)
          if (Array.isArray(media) && media.length) {
            payload.images = media.map((m: any) => ({ id: m.id, url: this.abs(m.url || m.image_url || m.path || '') }))
          }
        } catch {}
      }
      // Prepend main image if not present
      if (payload.main_image_url) {
        const main = this.abs(payload.main_image_url)
        const exists = Array.isArray(payload.images) && payload.images.some((i: any) => i?.url === main)
        if (!exists) {
          payload.images = [{ id: 0, url: main }, ...(Array.isArray(payload.images) ? payload.images : [])]
        }
      }

      // Plans/renders normalization
      if (Array.isArray(payload.plans)) {
        payload.plans = payload.plans.map((p: any) => {
          const img = p?.image_url || p?.image || p?.thumb
          const file = p?.file_url || p?.file
          const purl = p?.plan_url || p?.url
          return {
            ...p,
            image_url: img ? this.abs(img) : undefined,
            file_url: file ? this.abs(file) : undefined,
            plan_url: purl && /^https?:\/\//i.test(purl) ? purl : (purl ? this.abs(purl) : undefined),
          }
        })
      } else {
        // Fallback: use renders as plans
        try {
          const renders = await this.getPropertyRenders(id)
          if (Array.isArray(renders) && renders.length) {
            payload.plans = renders.map((r: any) => ({
              id: r.id,
              name: r.name || 'Render',
              type: r.type || 'render',
              image_url: this.abs(r.url || r.image_url || r.path || ''),
              file_url: r.file ? this.abs(r.file) : undefined,
              plan_url: r.plan_url && /^https?:\/\//i.test(r.plan_url) ? r.plan_url : (r.plan_url ? this.abs(r.plan_url) : undefined),
              is_interactive: !!r.is_interactive,
            }))
          }
        } catch {}
      }

      // Suites normalization/fallback
      if (Array.isArray(payload.suites)) {
        payload.suites = payload.suites.map((s: any) => ({
          ...s,
          image_url: s?.image_url ? this.abs(s.image_url) : (s?.image ? this.abs(s.image) : undefined),
          size_sqm: s?.size_sqm ?? s?.area ?? undefined,
          is_available: typeof s?.is_available === 'boolean' ? s.is_available : (s?.status ? String(s.status).toLowerCase() === 'available' : undefined),
        }))
      } else {
        try {
          payload.suites = await this.getSuites(id)
        } catch {}
      }

      // Compute price_from if missing
      if (typeof payload.price_from !== 'number' && Array.isArray(payload.suites)) {
        const prices = payload.suites.filter((s: any) => s.is_available !== false).map((s: any) => Number(s.price || 0)).filter((n: number) => n > 0)
        if (prices.length) payload.price_from = Math.min(...prices)
      }

      return payload
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 404) {
        // Legacy fallback: try older endpoint and reconstruct
        try {
          const legacy = await this.client.get(`/api/real.estate.property/${id}`)
          const base = (legacy?.data && (legacy.data.record || legacy.data.data)) ? (legacy.data.record || legacy.data.data) : legacy?.data || {}
          const payload: any = { id, ...base }
          if (payload.main_image_url) payload.main_image_url = this.abs(payload.main_image_url)
          try {
            const media = await this.getPropertyImages(id)
            if (Array.isArray(media) && media.length) {
              payload.images = media.map((m: any) => ({ id: m.id, url: this.abs(m.url || m.image_url || m.path || '') }))
            }
          } catch {}
          try {
            payload.suites = await this.getSuites(id)
          } catch {}
          if (typeof payload.price_from !== 'number' && Array.isArray(payload.suites)) {
            const prices = payload.suites.filter((s: any) => s.is_available !== false).map((s: any) => Number(s.price || 0)).filter((n: number) => n > 0)
            if (prices.length) payload.price_from = Math.min(...prices)
          }
          // Ensure images includes main image first if available
          if (payload.main_image_url) {
            const main = this.abs(payload.main_image_url)
            const exists = Array.isArray(payload.images) && payload.images.some((i: any) => i?.url === main)
            if (!exists) payload.images = [{ id: 0, url: main }, ...(Array.isArray(payload.images) ? payload.images : [])]
          }
          return payload
        } catch {}
      }
      console.error('Error fetching property detail:', error)
      return null
    }
  }

  // Media helpers
  async getPropertyImages(propertyId: number): Promise<any[]> {
    try {
      const { data } = await this.client.get('/api/media/property-images', { params: { property_id: propertyId } })
      const records = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : [])
      return records.map((m: any) => ({
        ...m,
        url: this.abs(m?.url || m?.image_url || m?.path || ''),
        image_url: this.abs(m?.image_url || m?.url || m?.path || ''),
      }))
    } catch {
      return []
    }
  }

  async getPropertyRenders(propertyId: number): Promise<any[]> {
    try {
      const { data } = await this.client.get('/api/media/renders', { params: { property_id: propertyId } })
      const records = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : [])
      return records
    } catch {
      return []
    }
  }

  async getPropertyMaps(propertyId: number): Promise<any[]> {
    try {
      const { data } = await this.client.get('/api/media/maps', { params: { property_id: propertyId } })
      const records = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : [])
      return records.map((m: any) => ({
        ...m,
        url: this.abs(m?.url || m?.image_url || m?.path || ''),
        image_url: this.abs(m?.image_url || m?.url || m?.path || ''),
      }))
    } catch {
      return []
    }
  }

  async getSuites(propertyId: number): Promise<any[]> {
    try {
      const { data } = await this.client.get('/api/suites', { params: { property_id: propertyId } })
      const records = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : [])
      return records.map((s: any) => ({
        ...s,
        image_url: s?.image_url ? this.abs(s.image_url) : (s?.image ? this.abs(s.image) : undefined),
        size_sqm: s?.size_sqm ?? s?.area ?? undefined,
        is_available: typeof s?.is_available === 'boolean' ? s.is_available : (s?.status ? String(s.status).toLowerCase() === 'available' : undefined),
      }))
    } catch {
      return []
    }
  }

  // Customer portal
  async customerOffers(partnerId?: number): Promise<any[]> {
    try {
      if (partnerId) {
        const { data } = await this.client.get(`/api/customers/${partnerId}/offers`)
        return Array.isArray(data?.records) ? data.records : []
      }
      return await this.listOffers()
    } catch (error) {
      return []
    }
  }

  async customerPayments(partnerId: number): Promise<any[]> {
    try {
      const { data } = await this.client.get(`/api/customers/${partnerId}/payments`)
      return Array.isArray(data?.records) ? data.records : []
    } catch (error) {
      return []
    }
  }

  async customerDocuments(partnerId: number): Promise<any[]> {
    try {
      const { data } = await this.client.get(`/api/customers/${partnerId}/documents`)
      return Array.isArray(data?.records) ? data.records : []
    } catch (error) {
      return []
    }
  }

  async customerInvoices(partnerId: number): Promise<any[]> {
    try {
      const { data } = await this.client.get(`/api/customers/${partnerId}/invoices`)
      return Array.isArray(data?.records) ? data.records : []
    } catch (error) {
      return []
    }
  }

  async paymentTerms(): Promise<Array<{ id: number; name: string }>> {
    try {
      const { data } = await this.client.get('/api/payment_terms')
      return Array.isArray(data?.records) ? data.records : []
    } catch (error) {
      return []
    }
  }

  async countries(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const { data } = await this.client.get('/api/countries')
      return Array.isArray(data?.records) ? data.records : []
    } catch (error) {
      return []
    }
  }

  async states(countryId?: number): Promise<Array<{ id: number; name: string; code?: string; country_id: number }>> {
    try {
      const params: any = {}
      if (typeof countryId === 'number') params.country_id = countryId
      const { data } = await this.client.get('/api/states', { params })
      return Array.isArray(data?.records) ? data.records : []
    } catch (error) {
      return []
    }
  }

  // Auth
  async login(params: { login: string; password: string }): Promise<{ ok: boolean; uid?: number; name?: string } | null> {
    try {
      const body: any = { login: params.login, password: params.password, db: process.env.NEXT_PUBLIC_ODOO_DB }
      const { data } = await this.client.post('/api/auth/token', body)
      return data
    } catch (error) {
      if ((error as any)?.response?.status) {
        console.error('Odoo login error', (error as any).response.status, (error as any).response.data)
      }
      return null
    }
  }
  async signup(payload: { name: string; email: string; phone?: string; password: string }): Promise<{ ok: boolean; partner_id?: number } | null> {
    try {
      const body: any = { name: payload.name, login: payload.email, password: payload.password, db: process.env.NEXT_PUBLIC_ODOO_DB }
      if (payload.phone) body.phone = payload.phone
      const { data } = await this.client.post('/api/auth/signup', body)
      return data
    } catch (error) {
      if ((error as any)?.response?.status) {
        console.error('Odoo signup error', (error as any).response.status, (error as any).response.data)
      }
      return null
    }
  }

  async listOffers(): Promise<any[]> {
    try {
      const { data } = await this.client.get('/api/offers')
      return Array.isArray(data?.records) ? data.records : []
    } catch (error) {
      return []
    }
  }

  async getOffer(id: number): Promise<any | null> {
    try {
      const { data } = await this.client.get(`/api/offers/${id}`)
      return data
    } catch (error) {
      return null
    }
  }

  async downloadOffer(id: number): Promise<string | null> {
    try {
      const { data } = await this.client.get(`/api/offers/download/${id}`)
      return data?.url || null
    } catch (error) {
      return null
    }
  }

  async signOffer(id: number, payload: { token: string; signature?: string; signed_by?: string }): Promise<boolean> {
    try {
      await this.ensureCsrf()
      const body: any = { ...(payload as any) }
      if (this.csrfToken) body.csrf_token = this.csrfToken
      const { data } = await this.client.post(`/api/offers/sign/${id}`, body)
      return !!data?.ok
    } catch (error) {
      return false
    }
  }

  constructor() {
    this.client = axios.create({
      // Use Next.js API proxy to avoid CORS and expose no secrets in the browser
      baseURL: '/api/odoo',
      withCredentials: true,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    // Add request interceptor: ensure CSRF and attach token for mutating requests
    this.client.interceptors.request.use(async (config) => {
      const method = String(config.method || 'get').toLowerCase()
      const url = String(config.url || '')
      const skipEnsure =
        url.includes('/web/session/csrf') ||
        url.includes('/web/session/csrf_token') ||
        url.includes('/api/auth/token') ||
        url.includes('/api/auth/signup')
      if (!skipEnsure && ['post', 'put', 'patch', 'delete'].includes(method)) {
        await this.ensureCsrf()
        if (this.csrfToken) {
          const headers: any = config.headers || {}
          headers['X-CSRFToken'] = this.csrfToken
          headers['X-CSRF-Token'] = this.csrfToken
          headers['X-Requested-With'] = 'XMLHttpRequest'
          config.headers = headers
        }
      }
      return config
    })
  }

  // Properties API (mapped from new Odoo REST)
  async getProperties(filters?: PropertyFilter): Promise<Property[]> {
    try {
      // Map app filters to Odoo params
      const params: Record<string, any> = {}
      if (filters?.status) params.status = filters.status
      if (filters?.type && filters.type.length) params.type = filters.type[0]
      if (filters?.location && filters.location.length) params.city = filters.location[0]
      if (typeof filters?.minPrice === 'number') params.min_price = filters.minPrice
      if (typeof filters?.maxPrice === 'number') params.max_price = filters.maxPrice
      const { data } = await this.client.get('/api/properties', { params })
      const records = Array.isArray(data?.records) ? data.records : []
      return records.map(this.mapPropertyList)
    } catch (error: any) {
      // Fallback to legacy endpoint if new one not found
      const status = error?.response?.status
      if (status === 404) {
        try {
          const params: Record<string, any> = {}
          if (filters?.status) params.status = filters.status
          const legacy = await this.client.get('/api/real.estate.property', { params })
          const records = Array.isArray(legacy?.data?.records) ? legacy.data.records : (Array.isArray(legacy?.data) ? legacy.data : [])
          return records.map(this.mapPropertyList)
        } catch {
          return []
        }
      }
      return []
    }
  }

  async getFeaturedProperties(limit: number = 6): Promise<Property[]> {
    try {
      const { data } = await this.client.get('/api/properties', {
        params: { limit, status: 'available' },
      })
      const records = Array.isArray(data?.records) ? data.records : []
      return records.map(this.mapPropertyList)
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 404) {
        try {
          const legacy = await this.client.get('/api/real.estate.property', { params: { limit, status: 'available' } })
          const records = Array.isArray(legacy?.data?.records) ? legacy.data.records : (Array.isArray(legacy?.data) ? legacy.data : [])
          return records.map(this.mapPropertyList)
        } catch {
          return []
        }
      }
      return []
    }
  }

  async getInvestmentProperties(limit?: number): Promise<Property[]> {
    try {
      const { data } = await this.client.get('/api/properties', {
        params: { status: 'available', limit },
      })
      const records = Array.isArray(data?.records) ? data.records : []
      return records.map(this.mapPropertyList)
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 404) {
        try {
          const legacy = await this.client.get('/api/real.estate.property', { params: { status: 'available', limit } })
          const records = Array.isArray(legacy?.data?.records) ? legacy.data.records : (Array.isArray(legacy?.data) ? legacy.data : [])
          return records.map(this.mapPropertyList)
        } catch {
          return []
        }
      }
      return []
    }
  }

  // Leads API
  async createLead(lead: Omit<Lead, 'id' | 'created_date'>): Promise<Lead | null> {
    try {
      await this.ensureCsrf()
      const response = await this.client.post('/api/crm.lead', {
        ...lead,
        source: 'website',
        tag_ids: [`Website: ${lead.purpose === 'buy' ? 'LuxuryBuy' : 'Investor'}`],
        csrf_token: this.csrfToken,
      })
      return response.data
    } catch (error) {
      console.error('Error creating lead:', error)
      return null
    }
  }

  // Offers API
  async createOffer(offer: Omit<Offer, 'id'>): Promise<Offer | null> {
    try {
      // Map to backend offer request payload
      const payload: any = {
        suite_id: (offer as any).suite_id,
        name: (offer as any).name,
        email: (offer as any).email,
        phone: (offer as any).phone,
        payment_term_id: (offer as any).payment_term_id,
      }
      await this.ensureCsrf()
      const body2: any = { ...payload, csrf_token: this.csrfToken }
      const { data } = await this.client.post('/api/offers/request', body2)
      return data
    } catch (error) {
      console.error('Error creating offer:', error)
      return null
    }
  }

  // CMS Content API
  async getCMSContent(page: string): Promise<CMSContent[]> {
    try {
      const response = await this.client.get('/api/website.cms.config', {
        params: { page },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching CMS content:', error)
      return []
    }
  }

  async updateCMSContent(id: string, content: Partial<CMSContent>): Promise<boolean> {
    try {
      await this.ensureCsrf()
      await this.client.put(`/api/website.cms.config/${id}`, { ...content, csrf_token: this.csrfToken })
      return true
    } catch (error) {
      console.error('Error updating CMS content:', error)
      return false
    }
  }

  // Testimonials API
  async getTestimonials(type?: 'investor' | 'owner'): Promise<Testimonial[]> {
    try {
      const response = await this.client.get('/api/website.testimonial', {
        params: { type },
      })
      return response.data
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 404) return []
      // Swallow other errors as well to keep UI clean
      return []
    }
  }

  // Team API
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const response = await this.client.get('/api/website.team.member')
      return response.data
    } catch (error) {
      console.error('Error fetching team members:', error)
      return []
    }
  }

  // Statistics API
  async getStatistics(): Promise<Statistics | null> {
    try {
      const response = await this.client.get('/api/website.statistics')
      return response.data
    } catch (error) {
      console.error('Error fetching statistics:', error)
      return null
    }
  }

  // Newsletter subscription
  async subscribeNewsletter(email: string): Promise<boolean> {
    try {
      await this.ensureCsrf()
      await this.client.post('/api/newsletter.subscribe', { email, csrf_token: this.csrfToken })
      return true
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      return false
    }
  }

  // Download investment report
  async downloadInvestmentReport(propertyId: number): Promise<Blob | null> {
    try {
      const response = await this.client.get(
        `/api/real.estate.property/${propertyId}/investment-report`,
        { responseType: 'blob' }
      )
      return response.data
    } catch (error) {
      console.error('Error downloading investment report:', error)
      return null
    }
  }
}

export const odooAPI = new OdooAPI()
