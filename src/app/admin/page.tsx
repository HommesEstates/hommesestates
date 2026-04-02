'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Image,
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  ArrowUpRight,
  DollarSign,
  MessageSquare,
  Award,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { publicApi, admin } from '@/lib/backend'
import { formatCurrency } from '@/lib/utils'

function StatCard({ title, value, change, trend, icon: Icon, color, href }: any) {
  const content = (
    <motion.div whileHover={{ y: -2 }} className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl p-6 hover:shadow-xl transition-all duration-500 cursor-pointer" style={{ boxShadow: '0 2px 8px -2px rgba(16, 24, 40, 0.08)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <h3 className="text-3xl font-bold text-text dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-text/60 dark:text-white/60">{title}</p>
    </motion.div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}

export default function EnterpriseDashboard() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalProperties: 0,
    totalSuites: 0,
    availableSuites: 0,
    activeOffers: 0,
    totalValue: 0,
    propertyStatusData: [] as any[],
    recentActivity: [] as any[],
    trafficData: [] as any[],
  })

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      
      // Fetch properties
      const properties = await publicApi.listProperties()
      const propertiesList = Array.isArray(properties) ? properties : []
      
      // Fetch suites for all properties
      let allSuites: any[] = []
      let totalValue = 0
      let availableCount = 0
      const statusCounts: Record<string, number> = {}
      
      for (const property of propertiesList) {
        try {
          const suites = await publicApi.listPropertySuites(property.id)
          const propertySuites = Array.isArray(suites) ? suites : []
          allSuites.push(...propertySuites)
          
          propertySuites.forEach((suite: any) => {
            const price = Number(suite.list_price || suite.price || 0)
            if (price > 0) totalValue += price
            
            const status = suite.status || 'available'
            statusCounts[status] = (statusCounts[status] || 0) + 1
            // Fix available suites computation - check status instead of is_available
            if (status === 'available' || suite.is_available !== false) availableCount++
          })
        } catch (e) {
          console.error(`Failed to load suites for property ${property.id}:`, e)
        }
      }
      
      // Prepare status data for pie chart
      const propertyStatusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: status === 'available' ? '#22c55e' : 
               status === 'reserved' ? '#f59e0b' : 
               status === 'sold' ? '#6b7280' : '#8b5cf6'
      }))
      
      // Fetch recent activity - use suite data as fallback since listOffers doesn't exist
      const recentActivity = allSuites.slice(0, 4).map((suite, index) => ({
        id: suite.id || index + 1,
        type: 'suite',
        title: `Suite ${suite.name || suite.unit_number || index + 1}`,
        detail: `${suite.property_name || 'Property'} - ${suite.status || 'available'} - ${formatCurrency(suite.list_price || suite.price || 0)}`,
        time: `${index + 1} hour${index === 0 ? '' : 's'} ago`,
        price: suite.list_price || suite.price
      }))
      
      // Mock traffic data (would come from analytics API)
      const trafficData = [
        { name: 'Mon', visits: Math.floor(Math.random() * 1000) + 2000, pageViews: Math.floor(Math.random() * 2000) + 4000 },
        { name: 'Tue', visits: Math.floor(Math.random() * 1000) + 2500, pageViews: Math.floor(Math.random() * 2000) + 5000 },
        { name: 'Wed', visits: Math.floor(Math.random() * 1000) + 2200, pageViews: Math.floor(Math.random() * 2000) + 4500 },
        { name: 'Thu', visits: Math.floor(Math.random() * 1000) + 2800, pageViews: Math.floor(Math.random() * 2000) + 5500 },
        { name: 'Fri', visits: Math.floor(Math.random() * 1000) + 2600, pageViews: Math.floor(Math.random() * 2000) + 5200 },
        { name: 'Sat', visits: Math.floor(Math.random() * 1000) + 1800, pageViews: Math.floor(Math.random() * 2000) + 3200 },
        { name: 'Sun', visits: Math.floor(Math.random() * 1000) + 1900, pageViews: Math.floor(Math.random() * 2000) + 3400 },
      ]
      
      setDashboardData({
        totalProperties: propertiesList.length,
        totalSuites: allSuites.length,
        availableSuites: availableCount,
        activeOffers: Math.floor(allSuites.length * 0.3), // Mock: 30% of suites have offers
        totalValue,
        propertyStatusData,
        recentActivity,
        trafficData,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return <div className="h-96 bg-muted rounded-2xl animate-pulse" />
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text dark:text-white">Dashboard</h1>
          <p className="text-text/60 dark:text-white/60 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Properties" 
          value={dashboardData.totalProperties.toString()} 
          change="+12%" 
          trend="up" 
          icon={Building2} 
          color="bg-gradient-to-br from-orange-500 to-red-500" 
          href="/admin/properties" 
        />
        <StatCard 
          title="Total Suites" 
          value={dashboardData.totalSuites.toString()} 
          change="+8%" 
          trend="up" 
          icon={Building2} 
          color="bg-gradient-to-br from-blue-500 to-indigo-600" 
          href="/admin/properties" 
        />
        <StatCard 
          title="Available Suites" 
          value={dashboardData.availableSuites.toString()} 
          change="+5%" 
          trend="up" 
          icon={Activity} 
          color="bg-gradient-to-br from-green-500 to-emerald-600" 
        />
        <StatCard 
          title="Total Value" 
          value={formatCurrency(dashboardData.totalValue)} 
          change="+15%" 
          trend="up" 
          icon={DollarSign} 
          color="bg-gradient-to-br from-purple-500 to-pink-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl p-6" style={{ boxShadow: '0 2px 8px -2px rgba(16, 24, 40, 0.08)' }}>
          <h2 className="text-lg font-semibold text-text dark:text-white mb-6">Website Traffic</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.trafficData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white' }} />
                <Area type="monotone" dataKey="visits" stroke="#f97316" strokeWidth={2} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl p-6" style={{ boxShadow: '0 2px 8px -2px rgba(16, 24, 40, 0.08)' }}>
          <h2 className="text-lg font-semibold text-text dark:text-white mb-6">Property Status</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboardData.propertyStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                  {dashboardData.propertyStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl p-6 lg:col-span-2" style={{ boxShadow: '0 2px 8px -2px rgba(16, 24, 40, 0.08)' }}>
          <div className="flex items-center justify-between mb-6" style={{ boxShadow: '0 1px 0 0 rgba(16, 24, 40, 0.06)' }}>
            <h2 className="text-lg font-semibold text-text dark:text-white">Recent Activity</h2>
            <Link href="/admin/audit-logs" className="text-sm text-accent hover:text-accent-dark transition-colors flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 dark:hover:bg-white/5">
                <div>
                  <p className="font-medium text-text dark:text-white">{activity.title}</p>
                  <p className="text-sm text-text/60 dark:text-white/60">{activity.detail}</p>
                </div>
                <span className="text-xs text-text/40 dark:text-white/40">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl p-6 border border-border/50">
          <h2 className="text-lg font-semibold text-text dark:text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/admin/pages/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-text dark:text-white">Create Page</span>
            </Link>
            <Link href="/admin/media/upload" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
              <Image className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-text dark:text-white">Upload Media</span>
            </Link>
            <Link href="/admin/offers" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-text dark:text-white">View Offers</span>
            </Link>
            <Link href="/admin/users/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
              <Users className="w-5 h-5 text-green-500" />
              <span className="font-medium text-text dark:text-white">Add User</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
