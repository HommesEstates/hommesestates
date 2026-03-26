export interface Property {
  id: number
  name: string
  description: string
  property_type: 'office' | 'estate' | 'residential' | 'commercial'
  location: string
  address: string
  price: number
  currency: string
  bedrooms?: number
  bathrooms?: number
  area: number
  area_unit: 'sqm' | 'sqft'
  status: 'available' | 'sold' | 'leased' | 'reserved'
  images: string[]
  featured: boolean
  investment_ready: boolean
  investment_details?: InvestmentDetails
  amenities: string[]
  latitude?: number
  longitude?: number
  created_date: string
  updated_date: string
}

export interface InvestmentDetails {
  projected_rental_yield: number
  annual_appreciation: number
  resale_timeline: string
  occupancy_rate: number
  roi_percentage: number
  investment_case_study_url?: string
}

export interface PropertyFilter {
  type?: string[]
  location?: string[]
  minPrice?: number
  maxPrice?: number
  investmentReady?: boolean
  status?: string
  minBedrooms?: number
  maxBedrooms?: number
}

export interface Offer {
  id: number
  property_id: number
  partner_id: number
  price: number
  status: 'draft' | 'sent' | 'accepted' | 'refused'
  validity_date: string
}

export interface Lead {
  id: number
  name: string
  email: string
  phone: string
  purpose: 'buy' | 'invest' | 'manage'
  message: string
  property_id?: number
  source: string
  created_date: string
}

export interface CMSContent {
  id: string
  section: string
  page: string
  content: Record<string, any>
  order: number
  visible: boolean
  updated_date: string
}

export interface SEOMetadata {
  title: string
  description: string
  canonical?: string
  keywords?: string[]
  ogImage?: string
  ogType?: string
}

export interface Testimonial {
  id: number
  name: string
  role: string
  company?: string
  content: string
  rating: number
  image?: string
  type: 'investor' | 'owner'
}

export interface Service {
  id: string
  title: string
  description: string
  icon: string
  category: 'owner' | 'investor'
  features: string[]
}

export interface TeamMember {
  id: number
  name: string
  title: string
  quote: string
  image: string
  linkedin?: string
}

export interface Statistics {
  properties_managed: number
  assets_under_management: number
  years_of_excellence: number
  client_satisfaction: number
}
