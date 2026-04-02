'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Download,
  Plus,
  Check,
  X,
  RefreshCw,
} from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  title: string
  description?: string
  searchPlaceholder?: string
  searchFields?: (keyof T)[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onView?: (item: T) => void
  onRefresh?: () => void
  onBulkDelete?: (items: T[]) => void
  onExport?: () => void
  createHref?: string
  createLabel?: string
  filters?: React.ReactNode
  itemsPerPage?: number
  selectable?: boolean
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  title,
  description,
  searchPlaceholder = 'Search...',
  searchFields = [],
  onEdit,
  onDelete,
  onView,
  onRefresh,
  onBulkDelete,
  onExport,
  createHref,
  createLabel = 'Create New',
  filters,
  itemsPerPage = 10,
  selectable = true,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data]

    // Search filter
    if (searchQuery && searchFields.length > 0) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = String(item[field] || '').toLowerCase()
          return value.includes(query)
        })
      )
    }

    // Sort
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchQuery, searchFields, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(paginatedData.map((item) => keyExtractor(item))))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedItems(newSet)
  }

  const handleBulkDelete = () => {
    const itemsToDelete = data.filter((item) => selectedItems.has(keyExtractor(item)))
    onBulkDelete?.(itemsToDelete)
    setSelectedItems(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text dark:text-white">{title}</h1>
          {description && <p className="text-text/60 dark:text-white/60 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-border/50 rounded-lg text-sm font-medium text-text dark:text-white hover:bg-muted/50 dark:hover:bg-white/5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-border/50 rounded-lg text-sm font-medium text-text dark:text-white hover:bg-muted/50 dark:hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          )}
          {createHref && (
            <Link
              href={createHref}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              {createLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0a0a0a] border border-border/50 rounded-lg text-sm text-text dark:text-white placeholder:text-text/40 dark:placeholder:text-white/40 focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          {filters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white dark:bg-[#0a0a0a] border-border/50 text-text dark:text-white hover:bg-muted/50 dark:hover:bg-white/5'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && filters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-muted/30 dark:bg-white/5 rounded-xl border border-border/50">
              {filters}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      {selectable && selectedItems.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-3 bg-accent/10 dark:bg-accent/20 rounded-lg border border-accent/20"
        >
          <span className="text-sm font-medium text-accent">
            {selectedItems.size} items selected
          </span>
          <div className="flex-1" />
          {onBulkDelete && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          )}
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30 dark:bg-white/5">
                {selectable && (
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={paginatedData.length > 0 && selectedItems.size === paginatedData.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border/50 text-accent focus:ring-accent"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text/60 dark:text-white/60 ${
                      column.width || ''
                    }`}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center gap-1 hover:text-text dark:hover:text-white transition-colors"
                      >
                        {column.header}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
                {(onView || onEdit || onDelete) && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text/60 dark:text-white/60">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 2 : 1)}
                    className="px-4 py-12 text-center text-text/60 dark:text-white/60"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const id = keyExtractor(item)
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20 dark:hover:bg-white/5 transition-colors"
                    >
                      {selectable && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(id)}
                            onChange={() => toggleSelect(id)}
                            className="w-4 h-4 rounded border-border/50 text-accent focus:ring-accent"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {column.render ? (
                            column.render(item)
                          ) : (
                            <span className="text-sm text-text dark:text-white">
                              {(item as any)[column.key]}
                            </span>
                          )}
                        </td>
                      ))}
                      {(onView || onEdit || onDelete) && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {onView && (
                              <button
                                onClick={() => onView(item)}
                                className="p-1.5 text-text/60 dark:text-white/60 hover:text-accent dark:hover:text-accent transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="p-1.5 text-text/60 dark:text-white/60 hover:text-accent dark:hover:text-accent transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(item)}
                                className="p-1.5 text-text/60 dark:text-white/60 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-sm text-text/60 dark:text-white/60">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of{' '}
              {filteredData.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-accent text-white'
                      : 'hover:bg-muted/50 dark:hover:bg-white/5 text-text dark:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
