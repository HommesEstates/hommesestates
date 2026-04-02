'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, Globe, Mail, Phone, MapPin, Image as ImageIcon,
  Link as LinkIcon, Save, Loader2, AlertCircle, CheckCircle2,
  Shield, Bell, Moon, Sun, Database, Server,
  Key, FileText, Upload, X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SiteSettings {
  siteName: string
  tagline: string
  logo: string
  favicon: string
  contactEmail: string
  contactPhone: string
  address: string
  googleAnalyticsId: string
  googleMapsApiKey: string
  odooApiUrl: string
  odooApiKey: string
  facebookPixelId: string
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  maintenanceMode: boolean
  allowRegistration: boolean
}

const defaultSettings: SiteSettings = {
  siteName: 'Hommes Estates',
  tagline: 'Luxury Real Estate in Nigeria',
  logo: '',
  favicon: '',
  contactEmail: 'info@hommesestates.com',
  contactPhone: '+234 123 456 7890',
  address: 'Abuja, Nigeria',
  googleAnalyticsId: '',
  googleMapsApiKey: '',
  odooApiUrl: '',
  odooApiKey: '',
  facebookPixelId: '',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  maintenanceMode: false,
  allowRegistration: true
}

function SettingSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', helpText = '' }: {
  label: string
  value: string
  onChange: (val: string) => void
  type?: string
  placeholder?: string
  helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
      />
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  )
}

function ToggleField({ label, value, onChange, helpText = '' }: {
  label: string
  value: boolean
  onChange: (val: boolean) => void
  helpText?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {helpText && <p className="text-xs text-gray-500 mt-0.5">{helpText}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-gray-300'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings({ ...defaultSettings, ...data })
      }
    } catch (e) {
      // Use default settings
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (res.ok) {
        toast.success('Settings saved successfully')
      } else {
        throw new Error('Failed to save')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof SiteSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
    { id: 'email', label: 'Email', icon: Server },
    { id: 'advanced', label: 'Advanced', icon: Shield }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-500">Configure your website settings and preferences</p>
        </div>
        <button 
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-accent text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'general' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <SettingSection title="Site Identity" icon={Globe}>
              <InputField
                label="Site Name"
                value={settings.siteName}
                onChange={(v) => updateSetting('siteName', v)}
                placeholder="Your Site Name"
              />
              <InputField
                label="Tagline"
                value={settings.tagline}
                onChange={(v) => updateSetting('tagline', v)}
                placeholder="Brief description of your site"
              />
              <InputField
                label="Logo URL"
                value={settings.logo}
                onChange={(v) => updateSetting('logo', v)}
                placeholder="https://..."
              />
              <InputField
                label="Favicon URL"
                value={settings.favicon}
                onChange={(v) => updateSetting('favicon', v)}
                placeholder="https://..."
              />
            </SettingSection>

            <SettingSection title="Appearance" icon={ImageIcon}>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">Brand colors and theme settings can be configured in the theme configuration file.</p>
              </div>
            </SettingSection>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <SettingSection title="Contact Information" icon={Mail}>
              <InputField
                label="Contact Email"
                value={settings.contactEmail}
                onChange={(v) => updateSetting('contactEmail', v)}
                placeholder="contact@example.com"
              />
              <InputField
                label="Contact Phone"
                value={settings.contactPhone}
                onChange={(v) => updateSetting('contactPhone', v)}
                placeholder="+234 123 456 7890"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => updateSetting('address', e.target.value)}
                  placeholder="Your business address"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                />
              </div>
            </SettingSection>

            <SettingSection title="Social Links" icon={LinkIcon}>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600">Social media links can be managed in the Partners section.</p>
              </div>
            </SettingSection>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <SettingSection title="Analytics" icon={Database}>
              <InputField
                label="Google Analytics ID"
                value={settings.googleAnalyticsId}
                onChange={(v) => updateSetting('googleAnalyticsId', v)}
                placeholder="G-XXXXXXXXXX"
                helpText="Your Google Analytics 4 Measurement ID"
              />
              <InputField
                label="Facebook Pixel ID"
                value={settings.facebookPixelId}
                onChange={(v) => updateSetting('facebookPixelId', v)}
                placeholder="XXXXXXXXXX"
              />
            </SettingSection>

            <SettingSection title="Maps & APIs" icon={MapPin}>
              <InputField
                label="Google Maps API Key"
                value={settings.googleMapsApiKey}
                onChange={(v) => updateSetting('googleMapsApiKey', v)}
                placeholder="AIza..."
                helpText="Required for map displays on property pages"
              />
            </SettingSection>

            <SettingSection title="Odoo ERP" icon={Server}>
              <InputField
                label="Odoo API URL"
                value={settings.odooApiUrl}
                onChange={(v) => updateSetting('odooApiUrl', v)}
                placeholder="https://odoo.example.com"
              />
              <InputField
                label="Odoo API Key"
                value={settings.odooApiKey}
                onChange={(v) => updateSetting('odooApiKey', v)}
                type="password"
                placeholder="••••••••"
              />
            </SettingSection>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <SettingSection title="SMTP Configuration" icon={Server}>
              <InputField
                label="SMTP Host"
                value={settings.smtpHost}
                onChange={(v) => updateSetting('smtpHost', v)}
                placeholder="smtp.gmail.com"
              />
              <InputField
                label="SMTP Port"
                value={settings.smtpPort}
                onChange={(v) => updateSetting('smtpPort', v)}
                placeholder="587"
              />
              <InputField
                label="SMTP Username"
                value={settings.smtpUser}
                onChange={(v) => updateSetting('smtpUser', v)}
                placeholder="your@email.com"
              />
              <InputField
                label="SMTP Password"
                value={settings.smtpPass}
                onChange={(v) => updateSetting('smtpPass', v)}
                type="password"
                placeholder="••••••••"
              />
            </SettingSection>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <SettingSection title="System Settings" icon={Shield}>
              <ToggleField
                label="Maintenance Mode"
                value={settings.maintenanceMode}
                onChange={(v) => updateSetting('maintenanceMode', v)}
                helpText="When enabled, the site will show a maintenance page to visitors"
              />
              <ToggleField
                label="Allow User Registration"
                value={settings.allowRegistration}
                onChange={(v) => updateSetting('allowRegistration', v)}
                helpText="Allow new users to register accounts"
              />
            </SettingSection>

            <SettingSection title="Data Management" icon={Database}>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <h4 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h4>
                <p className="text-xs text-red-600 mb-4">These actions cannot be undone. Please be careful.</p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  Clear All Cache
                </button>
              </div>
            </SettingSection>
          </div>
        )}
      </div>
    </div>
  )
}
