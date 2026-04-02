'use client'

import { useState, useEffect } from 'react'
import { DataTable, Column } from '@/components/admin/DataTable'
import {
  FileText,
  Image,
  Building2,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' | 'LOGIN' | 'LOGOUT'

interface AuditLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: AuditAction
  entityType: string
  entityId: string
  entityName: string
  changes: Record<string, { before: any; after: any }> | null
  ipAddress: string
  userAgent: string
  createdAt: string
}

const actionIcons: Record<AuditAction, React.ElementType> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  PUBLISH: CheckCircle,
  UNPUBLISH: XCircle,
  LOGIN: LogIn,
  LOGOUT: LogOut,
}

const actionColors: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  PUBLISH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  UNPUBLISH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  LOGIN: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const entityIcons: Record<string, React.ElementType> = {
  Page: FileText,
  Media: Image,
  Property: Building2,
  User: Users,
}

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Super Admin',
    userEmail: 'admin@hommesestates.com',
    action: 'CREATE',
    entityType: 'Property',
    entityId: 'prop-1',
    entityName: 'Fusion Wuse Tower',
    changes: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: '2024-03-28T14:30:00Z',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Content Editor',
    userEmail: 'editor@hommesestates.com',
    action: 'UPDATE',
    entityType: 'Page',
    entityId: 'page-1',
    entityName: 'About Us',
    changes: {
      title: { before: 'About', after: 'About Us' },
      content: { before: 'Old content', after: 'New content' },
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: '2024-03-28T13:15:00Z',
  },
  {
    id: '3',
    userId: '1',
    userName: 'Super Admin',
    userEmail: 'admin@hommesestates.com',
    action: 'DELETE',
    entityType: 'Media',
    entityId: 'media-1',
    entityName: 'old-banner.jpg',
    changes: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: '2024-03-28T11:45:00Z',
  },
  {
    id: '4',
    userId: '2',
    userName: 'Content Editor',
    userEmail: 'editor@hommesestates.com',
    action: 'PUBLISH',
    entityType: 'Page',
    entityId: 'page-2',
    entityName: 'Services',
    changes: { status: { before: 'DRAFT', after: 'PUBLISHED' } },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: '2024-03-28T10:20:00Z',
  },
  {
    id: '5',
    userId: '3',
    userName: 'Property Manager',
    userEmail: 'manager@hommesestates.com',
    action: 'LOGIN',
    entityType: 'User',
    entityId: 'user-3',
    entityName: 'Property Manager',
    changes: null,
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    createdAt: '2024-03-28T09:00:00Z',
  },
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setLogs(mockAuditLogs)
      setLoading(false)
    }, 500)
  }, [])

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (item) => {
        const Icon = actionIcons[item.action]
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              actionColors[item.action]
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {item.action}
          </span>
        )
      },
      sortable: true,
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (item) => {
        const Icon = entityIcons[item.entityType] || FileText
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-text/50 dark:text-white/50" />
            <div>
              <p className="text-sm font-medium text-text dark:text-white">
                {item.entityName}
              </p>
              <p className="text-xs text-text/50 dark:text-white/50">{item.entityType}</p>
            </div>
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'userName',
      header: 'User',
      render: (item) => (
        <div>
          <p className="text-sm font-medium text-text dark:text-white">{item.userName}</p>
          <p className="text-xs text-text/50 dark:text-white/50">{item.userEmail}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'changes',
      header: 'Changes',
      render: (item) => {
        if (!item.changes) return <span className="text-text/40 dark:text-white/40">-</span>
        const keys = Object.keys(item.changes)
        return (
          <div className="text-sm">
            {keys.slice(0, 2).map((key) => (
              <div key={key} className="text-text/60 dark:text-white/60">
                {key}:{' '}
                <span className="line-through text-red-500">
                  {String(item.changes![key].before).substring(0, 20)}
                </span>{' '}
                <span className="text-green-500">
                  {String(item.changes![key].after).substring(0, 20)}
                </span>
              </div>
            ))}
            {keys.length > 2 && (
              <span className="text-xs text-text/40 dark:text-white/40">
                +{keys.length - 2} more
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (item) => (
        <span className="text-xs text-text/60 dark:text-white/60 font-mono">
          {item.ipAddress}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'createdAt',
      header: 'Time',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm text-text/60 dark:text-white/60">
          <Clock className="w-3.5 h-3.5" />
          {new Date(item.createdAt).toLocaleString()}
        </div>
      ),
      sortable: true,
    },
  ]

  const filters = (
    <div className="flex flex-wrap gap-4">
      <div>
        <label className="text-xs font-medium text-text/60 dark:text-white/60 mb-1.5 block">
          Action
        </label>
        <select className="px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-border/50 rounded-lg text-sm text-text dark:text-white focus:outline-none focus:border-accent">
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="PUBLISH">Publish</option>
          <option value="UNPUBLISH">Unpublish</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-text/60 dark:text-white/60 mb-1.5 block">
          Entity Type
        </label>
        <select className="px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-border/50 rounded-lg text-sm text-text dark:text-white focus:outline-none focus:border-accent">
          <option value="">All Entities</option>
          <option value="Page">Page</option>
          <option value="Media">Media</option>
          <option value="Property">Property</option>
          <option value="User">User</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-text/60 dark:text-white/60 mb-1.5 block">
          Date Range
        </label>
        <select className="px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-border/50 rounded-lg text-sm text-text dark:text-white focus:outline-none focus:border-accent">
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <DataTable
      data={logs}
      columns={columns}
      keyExtractor={(item) => item.id}
      title="Audit Logs"
      description="Track all changes made to your content, users, and system settings."
      searchPlaceholder="Search by user, entity, or action..."
      searchFields={['userName', 'userEmail', 'entityName', 'entityType', 'action']}
      filters={filters}
      onExport={() => alert('Export functionality would generate a CSV/Excel file')}
      selectable={false}
      itemsPerPage={20}
    />
  )
}
