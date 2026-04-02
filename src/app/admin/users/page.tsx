'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Plus, Search, Filter, MoreHorizontal, 
  Shield, Mail, User as UserIcon, Check, X,
  Trash2, Edit3, UserPlus, Loader2, AlertCircle,
  Calendar, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { SessionUser } from '@/lib/auth'

interface User extends SessionUser {
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

const roleColors: Record<SessionUser['role'], string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  EDITOR: 'bg-blue-100 text-blue-700',
  DESIGNER: 'bg-pink-100 text-pink-700',
  PROPERTY_MANAGER: 'bg-orange-100 text-orange-700',
  VIEWER: 'bg-gray-100 text-gray-700'
}

const roleLabels: Record<SessionUser['role'], string> = {
  ADMIN: 'Administrator',
  EDITOR: 'Editor',
  DESIGNER: 'Designer',
  PROPERTY_MANAGER: 'Property Manager',
  VIEWER: 'Viewer'
}

const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@hommesestates.com',
    name: 'Super Admin',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: '2024-03-28T10:30:00Z',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    email: 'editor@hommesestates.com',
    name: 'Content Editor',
    role: 'EDITOR',
    isActive: true,
    lastLoginAt: '2024-03-27T14:20:00Z',
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    email: 'designer@hommesestates.com',
    name: 'UI Designer',
    role: 'DESIGNER',
    isActive: true,
    lastLoginAt: '2024-03-26T09:15:00Z',
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    email: 'manager@hommesestates.com',
    name: 'Property Manager',
    role: 'PROPERTY_MANAGER',
    isActive: false,
    lastLoginAt: null,
    createdAt: '2024-02-15',
  },
  {
    id: '5',
    email: 'viewer@hommesestates.com',
    name: 'Read Only User',
    role: 'VIEWER',
    isActive: true,
    lastLoginAt: '2024-03-25T16:45:00Z',
    createdAt: '2024-03-01',
  },
]

function UserCard({ user, onEdit, onToggle, onDelete }: { 
  user: User
  onEdit: (u: User) => void
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all ${
        !user.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-accent">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
            </div>
            <button
              onClick={() => onToggle(user.id, !user.isActive)}
              className={`w-10 h-6 rounded-full transition-colors ${user.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${user.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              {roleLabels[user.role]}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {user.isActive ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Created</p>
                <p className="text-gray-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Last Login</p>
                <p className="text-gray-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {user.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleDateString() 
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button 
              onClick={() => onEdit(user)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button 
              onClick={() => onDelete(user.id)}
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function UserModal({ isOpen, onClose, onSave, user }: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  user?: User | null
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'VIEWER' as SessionUser['role'],
    isActive: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      })
    }
  }, [user])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSave(form)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{user ? 'Edit User' : 'Invite User'}</h2>
          <p className="text-gray-500 text-sm mt-1">{user ? 'Update user details and permissions' : 'Add a new user to the system'}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
            <input 
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
            <input 
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as SessionUser['role'] })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value="ADMIN">Administrator</option>
              <option value="EDITOR">Editor</option>
              <option value="DESIGNER">Designer</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Role determines user permissions and access levels</p>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <label className="text-sm font-medium text-gray-700">Active Status</label>
              <p className="text-xs text-gray-500">User can log in when active</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : user ? 'Save Changes' : 'Invite User'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      // In production, this would fetch from API
      await new Promise(r => setTimeout(r, 500))
      setUsers(mockUsers)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(formData: any) {
    try {
      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u))
        toast.success('User updated')
      } else {
        const newUser: User = {
          ...formData,
          id: String(users.length + 1),
          lastLoginAt: null,
          createdAt: new Date().toISOString()
        }
        setUsers([...users, newUser])
        toast.success('User invited')
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return
    setUsers(users.filter(u => u.id !== id))
    toast.success('User deleted')
  }

  async function handleToggle(id: string, active: boolean) {
    setUsers(users.map(u => u.id === id ? { ...u, isActive: active } : u))
    toast.success(`User ${active ? 'activated' : 'deactivated'}`)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? u.isActive : !u.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    neverLoggedIn: users.filter(u => !u.lastLoginAt).length
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Users</h1>
          <p className="text-gray-500">Manage system users and role-based permissions</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
        >
          <UserPlus className="w-5 h-5" />
          Invite User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Total Users</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Active</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Administrators</p>
          <p className="text-3xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Never Logged In</p>
          <p className="text-3xl font-bold text-amber-600">{stats.neverLoggedIn}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Administrator</option>
          <option value="EDITOR">Editor</option>
          <option value="DESIGNER">Designer</option>
          <option value="PROPERTY_MANAGER">Property Manager</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No users found</p>
          <p className="text-gray-400 text-sm mt-1">Invite your first user to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard 
              key={user.id}
              user={user}
              onEdit={(u) => { setEditingUser(u); setIsModalOpen(true); }}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        user={editingUser}
      />
    </div>
  )
}
