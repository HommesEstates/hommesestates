'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Eye, 
  Clock, ArrowUpRight, ArrowDownRight, Calendar,
  DollarSign, MousePointer, Globe, Smartphone, Laptop,
  Loader2, Download, RefreshCw, Filter, MoreHorizontal
} from 'lucide-react'

interface AnalyticsData {
  pageViews: { value: number; change: number }
  uniqueVisitors: { value: number; change: number }
  avgSession: { value: string; change: number }
  bounceRate: { value: number; change: number }
  topPages: { path: string; views: number; unique: number }[]
  trafficSources: { source: string; visitors: number; percentage: number }[]
  deviceBreakdown: { device: string; percentage: number }[]
  weeklyData: { day: string; views: number; visitors: number }[]
}

const mockData: AnalyticsData = {
  pageViews: { value: 24580, change: 12.5 },
  uniqueVisitors: { value: 8420, change: 8.3 },
  avgSession: { value: '4:32', change: -2.1 },
  bounceRate: { value: 42.3, change: -5.2 },
  topPages: [
    { path: '/', views: 8540, unique: 3200 },
    { path: '/properties', views: 5230, unique: 2100 },
    { path: '/properties/fusion-wuse', views: 3120, unique: 1450 },
    { path: '/about', views: 1890, unique: 980 },
    { path: '/contact', views: 1450, unique: 720 }
  ],
  trafficSources: [
    { source: 'Organic Search', visitors: 4520, percentage: 53.7 },
    { source: 'Direct', visitors: 1850, percentage: 22.0 },
    { source: 'Social Media', visitors: 1250, percentage: 14.8 },
    { source: 'Referral', visitors: 520, percentage: 6.2 },
    { source: 'Email', visitors: 280, percentage: 3.3 }
  ],
  deviceBreakdown: [
    { device: 'Mobile', percentage: 58.2 },
    { device: 'Desktop', percentage: 35.5 },
    { device: 'Tablet', percentage: 6.3 }
  ],
  weeklyData: [
    { day: 'Mon', views: 3200, visitors: 1100 },
    { day: 'Tue', views: 3800, visitors: 1250 },
    { day: 'Wed', views: 3600, visitors: 1200 },
    { day: 'Thu', views: 4200, visitors: 1400 },
    { day: 'Fri', views: 5100, visitors: 1650 },
    { day: 'Sat', views: 2900, visitors: 950 },
    { day: 'Sun', views: 1780, visitors: 870 }
  ]
}

function StatCard({ title, value, change, icon: Icon, prefix = '' }: { 
  title: string
  value: string | number
  change: number
  icon: any
  prefix?: string
}) {
  const isPositive = change >= 0
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-accent" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{prefix}{value}</h3>
      <p className="text-sm text-gray-500">{title}</p>
    </motion.div>
  )
}

function SimpleBarChart({ data }: { data: { day: string; views: number; visitors: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.views))
  
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={item.day} className="flex items-center gap-4">
          <span className="text-sm text-gray-500 w-10">{item.day}</span>
          <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.views / maxValue) * 100}%` }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-lg"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600">
              {item.views.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  async function loadAnalytics() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setData(mockData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-500">Track website performance and visitor insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Page Views" 
          value={data.pageViews.value.toLocaleString()} 
          change={data.pageViews.change} 
          icon={Eye} 
        />
        <StatCard 
          title="Unique Visitors" 
          value={data.uniqueVisitors.value.toLocaleString()} 
          change={data.uniqueVisitors.change} 
          icon={Users} 
        />
        <StatCard 
          title="Avg. Session" 
          value={data.avgSession.value} 
          change={data.avgSession.change} 
          icon={Clock} 
        />
        <StatCard 
          title="Bounce Rate" 
          value={`${data.bounceRate.value}%`} 
          change={data.bounceRate.change} 
          icon={ArrowDownRight}
          prefix=""
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Traffic */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Traffic</h3>
          <SimpleBarChart data={data.weeklyData} />
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Breakdown</h3>
          <div className="space-y-4">
            {data.deviceBreakdown.map((device) => (
              <div key={device.device} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {device.device === 'Mobile' && <Smartphone className="w-5 h-5 text-gray-600" />}
                  {device.device === 'Desktop' && <Laptop className="w-5 h-5 text-gray-600" />}
                  {device.device === 'Tablet' && <Globe className="w-5 h-5 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{device.device}</span>
                    <span className="text-sm text-gray-500">{device.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${device.percentage}%` }}
                      className="h-full bg-accent rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Top Pages</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.topPages.map((page, idx) => (
              <div key={page.path} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{page.path}</p>
                  <p className="text-sm text-gray-500">{page.unique.toLocaleString()} unique visitors</p>
                </div>
                <span className="text-sm font-medium text-gray-900">{page.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Traffic Sources</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.trafficSources.map((source) => (
              <div key={source.source} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{source.source}</p>
                  <p className="text-sm text-gray-500">{source.visitors.toLocaleString()} visitors</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
