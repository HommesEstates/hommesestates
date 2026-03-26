import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  FileText,
  Image,
  Building2,
  Users,
  TrendingUp,
  Eye,
  Activity,
} from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getSession()

  // Fetch dashboard stats
  const [pagesCount, mediaCount, propertiesCount, usersCount, recentPages, recentMedia] =
    await Promise.all([
      prisma.page.count(),
      prisma.media.count(),
      prisma.property.count(),
      prisma.user.count(),
      prisma.page.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, updatedAt: true, status: true },
      }),
      prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, originalName: true, url: true, thumbnailUrl: true, mimeType: true, createdAt: true },
      }),
    ])

  const stats = [
    {
      name: 'Total Pages',
      value: pagesCount,
      icon: FileText,
      change: '+12%',
      color: 'bg-blue-500',
    },
    {
      name: 'Media Files',
      value: mediaCount,
      icon: Image,
      change: '+8%',
      color: 'bg-purple-500',
    },
    {
      name: 'Properties',
      value: propertiesCount,
      icon: Building2,
      change: '+23%',
      color: 'bg-accent',
    },
    {
      name: 'Users',
      value: usersCount,
      icon: Users,
      change: '+5%',
      color: 'bg-secondary',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">
          Welcome back, {session?.name}
        </h1>
        <p className="text-text/60 dark:text-white/60">
          Here's what's happening with your website today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-secondary">
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-heading font-bold mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-text/60 dark:text-white/60">
                {stat.name}
              </p>
            </div>
          )
        })}
      </div>

      {/* Quick Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Pages */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 xl:col-span-2">
          <h2 className="text-xl font-heading font-bold mb-4">Recent Pages</h2>
          <div className="space-y-3">
            {recentPages.map((p: { id: string; title: string; slug: string; updatedAt: Date }) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-semibold">{p.title} <span className="text-xs text-text/60 dark:text-white/60">/{p.slug}</span></p>
                    <p className="text-sm text-text/60 dark:text-white/60">Updated {new Date(p.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
                <a className="text-sm font-semibold text-accent hover:underline" href={`/admin/pages/${p.id}`}>Edit</a>
              </div>
            ))}
            {recentPages.length === 0 && (
              <div className="p-3 text-text/60 dark:text-white/60 rounded-lg bg-neutral-50 dark:bg-neutral-800">No pages yet</div>
            )}
          </div>
        </div>

        {/* Recent Media */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-heading font-bold mb-4">Recent Media</h2>
          <div className="grid grid-cols-3 gap-3">
            {recentMedia.map((m: { id: string; originalName: string; url: string; thumbnailUrl: string | null }) => (
              <div key={m.id} className="rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumbnailUrl || m.url} alt={m.originalName} className="w-full h-full object-cover" />
              </div>
            ))}
            {recentMedia.length === 0 && (
              <div className="col-span-3 text-sm text-text/60 dark:text-white/60">No media yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
