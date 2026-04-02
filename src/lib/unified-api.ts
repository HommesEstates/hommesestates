/**
 * Frontend Unified API Client for HommesEstates
 * =============================================
 *
 * This client automatically routes requests to either:
 * 1. FastAPI backend (default)
 * 2. Odoo backend (when NEXT_PUBLIC_BACKEND_MODE=odoo)
 *
 * Environment Variables:
 * ---------------------
 * NEXT_PUBLIC_BACKEND_MODE=fastapi|odoo    # Switch between backends (default: fastapi)
 * NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
 * NEXT_PUBLIC_ODOO_URL=https://odoo.hommesestates.com/odoo
 * NEXT_PUBLIC_ODOO_DB=hommesestates_prod
 */

import { useMemo } from 'react';

// Environment configuration
const BACKEND_MODE = process.env.NEXT_PUBLIC_BACKEND_MODE || 'fastapi';
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL || '';
const ODOO_DB = process.env.NEXT_PUBLIC_ODOO_DB || '';

// Types matching backend models
export interface Property {
  id: number;
  name: string;
  code: string;
  property_type: string;
  address: string;
  description: string;
  image_url?: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export interface Suite {
  id: number;
  property_id: number;
  name: string;
  number: string;
  list_price: number;
  currency: string;
  area_sqm: number;
  is_available: boolean;
  published: number;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  name: string;
  partner_id: number;
  property_id: number;
  suite_id: number;
  state: 'draft' | 'sent' | 'sale' | 'cancelled';
  price_total: number;
  currency: string;
  payment_percentage?: number;
  property_name?: string;
  suite_name?: string;
  suite_number?: string;
  validity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentSchedule {
  id: number;
  offer_id: number;
  description: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
}

export interface Payment {
  id: number;
  partner_id: number;
  invoice_id?: number;
  amount: number;
  currency: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  name: string;
  amount_total: number;
  amount_residual: number;
  currency: string;
  invoice_date: string;
  payment_state: string;
  state: string;
  portal_url?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  partner_id: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Base API Client
class BaseAPIClient {
  protected baseUrl: string;
  protected dbName: string;

  constructor(baseUrl: string, dbName: string = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.dbName = dbName;
  }

  protected async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('he_access_token') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(this.dbName && { 'X-Odoo-Db': this.dbName }),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  protected async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  protected async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  protected async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  protected async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// FastAPI Client
class FastAPIClient extends BaseAPIClient {
  async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const response = await this.post('/auth/token', { email, password });
      if (response.access_token) {
        localStorage.setItem('he_access_token', response.access_token);
        localStorage.setItem('he_refresh_token', response.refresh_token);
        return response;
      }
      return null;
    } catch {
      return null;
    }
  }

  async signup(name: string, email: string, phone: string, password: string): Promise<{ id: number } | null> {
    try {
      const response = await this.post('/auth/signup', { name, email, phone, password });
      return response;
    } catch {
      return null;
    }
  }

  async getProperties(): Promise<Property[]> {
    const response = await this.get('/properties');
    return Array.isArray(response) ? response : response.records || [];
  }

  async getProperty(id: number): Promise<Property | null> {
    try {
      return await this.get(`/properties/${id}`);
    } catch {
      return null;
    }
  }

  async getPropertySuites(propertyId: number): Promise<Suite[]> {
    const response = await this.get(`/properties/${propertyId}/suites`);
    return Array.isArray(response) ? response : response.records || [];
  }

  async getMyOffers(): Promise<Offer[]> {
    const response = await this.get('/portal/offers');
    return Array.isArray(response) ? response : response.records || [];
  }

  async getMyOffer(id: number): Promise<Offer | null> {
    try {
      return await this.get(`/portal/offers/${id}`);
    } catch {
      return null;
    }
  }

  async getOfferPaymentSchedules(offerId: number): Promise<PaymentSchedule[]> {
    const response = await this.get(`/portal/offers/${offerId}/schedules`);
    return Array.isArray(response) ? response : response.records || [];
  }

  async signOffer(offerId: number, signature: string): Promise<boolean> {
    try {
      const response = await this.post(`/portal/offers/${offerId}/sign`, { signature });
      return response.ok || response.success || false;
    } catch {
      return false;
    }
  }

  async getMyInvoices(): Promise<Invoice[]> {
    const response = await this.get('/portal/invoices');
    return Array.isArray(response) ? response : response.records || [];
  }

  async getMyPayments(): Promise<Payment[]> {
    const response = await this.get('/portal/payments');
    return Array.isArray(response) ? response : response.records || [];
  }

  async getMyDocuments(): Promise<any[]> {
    const response = await this.get('/portal/documents');
    return Array.isArray(response) ? response : response.records || [];
  }

  async downloadDocument(documentId: number): Promise<string | null> {
    try {
      const response = await this.get(`/portal/documents/${documentId}/download`);
      return response.url || null;
    } catch {
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('he_refresh_token');
    if (!refreshToken) return null;

    try {
      const response = await this.post('/auth/refresh', { refresh_token: refreshToken });
      if (response.access_token) {
        localStorage.setItem('he_access_token', response.access_token);
        return response.access_token;
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Odoo Client
class OdooClient extends BaseAPIClient {
  private sessionId: string | null = null;

  constructor(baseUrl: string, dbName: string) {
    super(baseUrl, dbName);
    if (typeof window !== 'undefined') {
      this.sessionId = localStorage.getItem('odoo_session_id');
    }
  }

  private async requestWithSession(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.sessionId && { 'Cookie': `session_id=${this.sessionId}` }),
      ...((options.headers as Record<string, string>) || {}),
    };

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, { ...options, headers });

    // Save session ID from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie && setCookie.includes('session_id=')) {
      const match = setCookie.match(/session_id=([^;]+)/);
      if (match) {
        this.sessionId = match[1];
        localStorage.setItem('odoo_session_id', this.sessionId);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const response = await this.requestWithSession('/api/auth/token', {
        method: 'POST',
        body: JSON.stringify({ login: email, password, db: this.dbName }),
      });

      if (response.ok && response.uid) {
        // Map Odoo response to AuthResponse
        const authResponse: AuthResponse = {
          access_token: response.session_id || '',
          refresh_token: '',
          user: {
            id: response.uid,
            name: response.name,
            email: email,
            role: response.role || 'customer',
            partner_id: response.partner_id,
          },
        };

        localStorage.setItem('he_access_token', authResponse.access_token);
        return authResponse;
      }
      return null;
    } catch {
      return null;
    }
  }

  async signup(name: string, email: string, phone: string, password: string): Promise<{ id: number } | null> {
    try {
      const response = await this.requestWithSession('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password }),
      });

      if (response.ok) {
        return { id: response.partner_id };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getProperties(): Promise<Property[]> {
    const response = await this.requestWithSession('/api/properties');
    return (response.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code || '',
      property_type: 'residential',
      address: r.city || '',
      description: '',
      image_url: r.main_image_url,
      published: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  async getProperty(id: number): Promise<Property | null> {
    try {
      const response = await this.requestWithSession(`/api/properties/${id}`);
      if (response.error) return null;

      return {
        id: response.id,
        name: response.name,
        code: '',
        property_type: 'residential',
        address: response.city || '',
        description: response.description || '',
        image_url: response.main_image_url,
        published: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async getPropertySuites(propertyId: number): Promise<Suite[]> {
    const response = await this.requestWithSession(`/api/suites?property_id=${propertyId}`);
    return (response.records || []).map((r: any) => ({
      id: r.id,
      property_id: propertyId,
      name: r.name,
      number: r.suite_number || '',
      list_price: r.list_price,
      currency: r.currency || 'NGN',
      area_sqm: 0,
      is_available: r.is_available !== false,
      published: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  async getMyOffers(): Promise<Offer[]> {
    const response = await this.requestWithSession('/api/offers');
    return (response.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      partner_id: 0,
      property_id: r.property?.id || 0,
      suite_id: r.suite?.id || 0,
      state: r.state || 'draft',
      price_total: r.amount_total || 0,
      currency: 'NGN',
      property_name: r.property?.name,
      suite_name: r.suite?.name,
      suite_number: r.suite?.suite_number,
      validity_date: r.validity_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  async getMyOffer(id: number): Promise<Offer | null> {
    try {
      const response = await this.requestWithSession(`/api/offers/${id}`);
      if (response.error) return null;

      return {
        id: response.id,
        name: response.name,
        partner_id: 0,
        property_id: 0,
        suite_id: 0,
        state: response.state,
        price_total: response.amount_total,
        currency: response.currency || 'NGN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async getOfferPaymentSchedules(offerId: number): Promise<PaymentSchedule[]> {
    // Odoo doesn't have a separate endpoint for payment schedules
    // Return empty array - schedules can be embedded in offer response
    return [];
  }

  async signOffer(offerId: number, signature: string): Promise<boolean> {
    try {
      const response = await this.requestWithSession(`/api/offers/sign/${offerId}`, {
        method: 'POST',
        body: JSON.stringify({ signature }),
      });
      return response.ok || false;
    } catch {
      return false;
    }
  }

  async getMyInvoices(): Promise<Invoice[]> {
    // Get current user's partner_id from auth context
    // For Odoo, we use /api/customers/<partner_id>/invoices
    return [];
  }

  async getMyPayments(): Promise<Payment[]> {
    return [];
  }

  async getMyDocuments(): Promise<any[]> {
    return [];
  }

  async downloadDocument(documentId: number): Promise<string | null> {
    return null;
  }

  async refreshToken(): Promise<string | null> {
    // Odoo sessions are managed via cookies, not tokens
    return this.sessionId;
  }
}

// Unified Client
class UnifiedClient {
  private client: FastAPIClient | OdooClient;
  private mode: string;

  constructor() {
    this.mode = BACKEND_MODE;

    if (this.mode === 'odoo' && ODOO_URL && ODOO_DB) {
      this.client = new OdooClient(ODOO_URL, ODOO_DB);
    } else {
      this.client = new FastAPIClient(FASTAPI_URL);
    }
  }

  getMode(): string {
    return this.mode;
  }

  isOdoo(): boolean {
    return this.mode === 'odoo';
  }

  isFastAPI(): boolean {
    return this.mode === 'fastapi';
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse | null> {
    return this.client.login(email, password);
  }

  async signup(name: string, email: string, phone: string, password: string): Promise<{ id: number } | null> {
    return this.client.signup(name, email, phone, password);
  }

  // Properties
  async getProperties(): Promise<Property[]> {
    return this.client.getProperties();
  }

  async getProperty(id: number): Promise<Property | null> {
    return this.client.getProperty(id);
  }

  // Suites
  async getPropertySuites(propertyId: number): Promise<Suite[]> {
    return this.client.getPropertySuites(propertyId);
  }

  // Offers
  async getMyOffers(): Promise<Offer[]> {
    return this.client.getMyOffers();
  }

  async getMyOffer(id: number): Promise<Offer | null> {
    return this.client.getMyOffer(id);
  }

  async getOfferPaymentSchedules(offerId: number): Promise<PaymentSchedule[]> {
    return this.client.getOfferPaymentSchedules(offerId);
  }

  async signOffer(offerId: number, signature: string): Promise<boolean> {
    return this.client.signOffer(offerId, signature);
  }

  // Invoices
  async getMyInvoices(): Promise<Invoice[]> {
    return this.client.getMyInvoices();
  }

  // Payments
  async getMyPayments(): Promise<Payment[]> {
    return this.client.getMyPayments();
  }

  // Documents
  async getMyDocuments(): Promise<any[]> {
    return this.client.getMyDocuments();
  }

  async downloadDocument(documentId: number): Promise<string | null> {
    return this.client.downloadDocument(documentId);
  }

  // Token management
  async refreshToken(): Promise<string | null> {
    return this.client.refreshToken();
  }

  logout(): void {
    localStorage.removeItem('he_access_token');
    localStorage.removeItem('he_refresh_token');
    localStorage.removeItem('odoo_session_id');
  }
}

// Export singleton instance
export const unifiedClient = new UnifiedClient();

// React hook for using the unified client
export function useUnifiedClient() {
  return useMemo(() => unifiedClient, []);
}

// Export individual clients for direct use
export { FastAPIClient, OdooClient };
