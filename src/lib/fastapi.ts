/**
 * FastAPI Backend Client
 * Handles JWT authentication and API calls to the standalone FastAPI backend
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

// Types
export interface User {
  id: number
  username: string
  role: 'admin' | 'staff' | 'portal'
  partner_id?: number
  partner_name?: string
  partner_email?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user_id: number
  username: string
  role: string
  partner_id?: number
}

export interface Property {
  id: number
  name: string
  code?: string
  property_type: string
  address?: string
  city?: string
  description?: string
  published: number
  image_url?: string
  total_suites: number
  available_suites: number
}

export interface Suite {
  id: number
  name: string
  number?: string
  suite_type?: string
  list_price: number
  area_sqm: number
  currency: string
  is_available: number
  property_id: number
  property_name?: string
  block_name?: string
  floor_name?: string
}

export interface Offer {
  id: number
  code?: string
  name?: string
  state: string
  validity_date?: string
  price_total: number
  currency: string
  suite_name?: string
  suite_number?: string
  property_name?: string
  payment_status: string
  payment_percentage: number
}

export interface PaymentSchedule {
  id: number
  description?: string
  due_date: string
  amount: number
  paid_amount: number
  outstanding_amount: number
  status: string
}

export interface Payment {
  id: number
  amount: number
  currency: string
  date: string
  state: string
}

export interface Document {
  id: number
  name: string
  content_type: string
  doc_type: string
  size: number
  created_at: string
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'fastapi_access_token'
const REFRESH_TOKEN_KEY = 'fastapi_refresh_token'
const USER_KEY = 'fastapi_user'

class FastAPIClient {
  private client: AxiosInstance
  private refreshPromise: Promise<string | null> | null = null

  constructor() {
    // Use Next.js API proxy or direct backend URL
    const baseURL = process.env.NEXT_PUBLIC_FASTAPI_URL || '/api/backend'
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For cookies if using http-only
    })

    // Request interceptor - attach access token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle 401 and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
        
        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          
          try {
            const newToken = await this.refreshTokens()
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return this.client.request(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            this.clearAuth()
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  // Token management
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  setTokens(access: string, refresh: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  }

  clearAuth(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  }

  setUser(user: User): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<AuthResponse | null> {
    try {
      const { data } = await this.client.post('/auth/login', { username, password })
      
      if (data.access_token) {
        this.setTokens(data.access_token, data.refresh_token)
        this.setUser({
          id: data.user_id,
          username: data.username,
          role: data.role,
          partner_id: data.partner_id,
        })
      }
      
      return data
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  async signup(payload: {
    name: string
    email: string
    password: string
    phone?: string
    street?: string
    city?: string
    state_id?: number
    country_id?: number
  }): Promise<{ ok: boolean; partner_id: number; user_id: number } | null> {
    try {
      const { data } = await this.client.post('/auth/signup', payload)
      return data
    } catch (error) {
      console.error('Signup error:', error)
      return null
    }
  }

  async refreshTokens(): Promise<string | null> {
    // Prevent multiple refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) return null

      try {
        const { data } = await this.client.post('/auth/refresh', {
          refresh_token: refreshToken,
        })

        if (data.access_token) {
          this.setTokens(data.access_token, data.refresh_token)
          return data.access_token
        }
        return null
      } catch (error) {
        this.clearAuth()
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout')
    } catch (error) {
      // Ignore logout errors
    } finally {
      this.clearAuth()
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await this.client.get('/auth/me')
      this.setUser(data)
      return data
    } catch (error) {
      return null
    }
  }

  // Properties endpoints
  async getProperties(filters?: {
    property_type?: string
    limit?: number
  }): Promise<Property[]> {
    try {
      const { data } = await this.client.get('/properties', { params: filters })
      return Array.isArray(data) ? data : (data.records || [])
    } catch (error) {
      console.error('Error fetching properties:', error)
      return []
    }
  }

  async getProperty(id: number): Promise<Property | null> {
    try {
      const { data } = await this.client.get(`/properties/${id}`)
      return data
    } catch (error) {
      console.error('Error fetching property:', error)
      return null
    }
  }

  async getPropertySuites(propertyId: number): Promise<Suite[]> {
    try {
      const { data } = await this.client.get(`/properties/${propertyId}/suites`)
      return Array.isArray(data) ? data : (data.records || [])
    } catch (error) {
      console.error('Error fetching suites:', error)
      return []
    }
  }

  // Suites endpoints
  async getSuites(filters?: {
    property_id?: number
    suite_type?: string
    min_price?: number
    max_price?: number
  }): Promise<Suite[]> {
    try {
      const { data } = await this.client.get('/suites', { params: filters })
      return Array.isArray(data) ? data : (data.records || [])
    } catch (error) {
      console.error('Error fetching suites:', error)
      return []
    }
  }

  async getSuite(id: number): Promise<Suite | null> {
    try {
      const { data } = await this.client.get(`/suites/${id}`)
      return data
    } catch (error) {
      console.error('Error fetching suite:', error)
      return null
    }
  }

  // Payment terms
  async getPaymentTerms(): Promise<Array<{ id: number; name: string }>> {
    try {
      const { data } = await this.client.get('/payment_terms')
      return Array.isArray(data) ? data : (data.records || [])
    } catch (error) {
      return []
    }
  }

  // Countries and states
  async getCountries(): Promise<Array<{ id: number; name: string; code: string }>> {
    try {
      const { data } = await this.client.get('/countries')
      return Array.isArray(data) ? data : (data.records || [])
    } catch (error) {
      return []
    }
  }

  async getStates(countryId?: number): Promise<Array<{ id: number; name: string; code?: string; country_id: number }>> {
    try {
      const { data } = await this.client.get('/states', { params: { country_id: countryId } })
      return Array.isArray(data) ? data : (data.records || [])
    } catch (error) {
      return []
    }
  }

  // Public offer creation
  async createPublicOffer(payload: {
    name: string
    email: string
    suite_id: number
    phone?: string
    street?: string
    city?: string
    state_id?: number
    country_id?: number
    payment_term_id?: number
    expires_in_days?: number
    note?: string
  }): Promise<{ ok: boolean; id: number; name: string; validity_date: string; portal_url?: string } | null> {
    try {
      const { data } = await this.client.post('/offers/create_public', payload)
      return data
    } catch (error) {
      console.error('Error creating offer:', error)
      return null
    }
  }

  // Portal endpoints (require authentication)
  async getPortalDashboard(): Promise<any> {
    try {
      const { data } = await this.client.get('/portal/dashboard')
      return data
    } catch (error) {
      return null
    }
  }

  async getMyOffers(state?: string): Promise<Offer[]> {
    try {
      const { data } = await this.client.get('/portal/offers', { params: { state } })
      return Array.isArray(data) ? data : []
    } catch (error) {
      return []
    }
  }

  async getMyOffer(offerId: number): Promise<Offer | null> {
    try {
      const { data } = await this.client.get(`/portal/offers/${offerId}`)
      return data
    } catch (error) {
      return null
    }
  }

  async getOfferPaymentSchedules(offerId: number): Promise<PaymentSchedule[]> {
    try {
      const { data } = await this.client.get(`/portal/offers/${offerId}/payment-schedules`)
      return Array.isArray(data) ? data : []
    } catch (error) {
      return []
    }
  }

  async signOffer(offerId: number, signatureData: string): Promise<boolean> {
    try {
      const { data } = await this.client.post(`/portal/offers/${offerId}/sign`, {
        signature_data: signatureData,
      })
      return data.ok
    } catch (error) {
      return false
    }
  }

  async getMyPayments(): Promise<Payment[]> {
    try {
      const { data } = await this.client.get('/portal/payments')
      return Array.isArray(data) ? data : []
    } catch (error) {
      return []
    }
  }

  async getMyDocuments(docType?: string): Promise<Document[]> {
    try {
      const { data } = await this.client.get('/portal/documents', { params: { doc_type: docType } })
      return Array.isArray(data) ? data : []
    } catch (error) {
      return []
    }
  }

  async getDocumentDownloadUrl(documentId: number): Promise<string | null> {
    try {
      const { data } = await this.client.get(`/portal/documents/${documentId}/download`)
      return data.download_url
    } catch (error) {
      return null
    }
  }

  async getMyInvoices(): Promise<any[]> {
    try {
      const { data } = await this.client.get('/portal/invoices')
      return Array.isArray(data) ? data : []
    } catch (error) {
      return []
    }
  }

  async getProfile(): Promise<any> {
    try {
      const { data } = await this.client.get('/portal/profile')
      return data
    } catch (error) {
      return null
    }
  }

  async updateProfile(payload: {
    name?: string
    phone?: string
    street?: string
    city?: string
    state_id?: number
    country_id?: number
  }): Promise<boolean> {
    try {
      const { data } = await this.client.put('/portal/profile', payload)
      return data.ok
    } catch (error) {
      return false
    }
  }

  // Reports (admin/staff only)
  async getSalesSummary(filters?: {
    from_date?: string
    to_date?: string
    property_id?: number
  }): Promise<any> {
    try {
      const { data } = await this.client.get('/reports/sales/summary', { params: filters })
      return data
    } catch (error) {
      return null
    }
  }

  async getPaymentSummary(): Promise<any> {
    try {
      const { data } = await this.client.get('/reports/payments/summary')
      return data
    } catch (error) {
      return null
    }
  }

  async getDashboardData(): Promise<any> {
    try {
      const { data } = await this.client.get('/reports/dashboard')
      return data
    } catch (error) {
      return null
    }
  }
}

// Export singleton instance
export const fastAPI = new FastAPIClient()

// Export class for testing
export { FastAPIClient }
