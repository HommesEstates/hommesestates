import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Plus, FileText, CalendarClock, Circle, Search } from 'lucide-react'

export default async function PagesListPage() {
  const pages: {
    id: string
    slug: string
    title: string
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    isHomepage: boolean
    updatedAt: Date
  }[] = await prisma.page.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      isHomepage: true,
      updatedAt: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Pages</h1>
          <p className="text-text/60 dark:text-white/60">Manage website pages and content</p>
        </div>
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New Page
        </Link>
      </div>

      {/* Search (placeholder) */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text/40 dark:text-white/40" />
        <input
          placeholder="Search pages by title or slug"
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="text-left p-4">Title</th>
              <th className="text-left p-4">Slug</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Updated</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {p.title}
                        {p.isHomepage && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-white">Homepage</span>
                        )}
                      </div>
                      <div className="text-xs text-text/60 dark:text-white/60">ID: {p.id}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">/{p.slug}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Circle className={`w-2 h-2 ${p.status === 'PUBLISHED' ? 'text-secondary' : p.status === 'DRAFT' ? 'text-text/50' : 'text-accent'}`} />
                    {p.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="inline-flex items-center gap-2 text-text/70 dark:text-white/70">
                    <CalendarClock className="w-4 h-4" />
                    {new Date(p.updatedAt).toLocaleString()}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/content-editor?pageId=${p.id}`} className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accent-dark transition-colors text-sm font-medium">
                      Visual Editor
                    </Link>
                    <Link href={`/admin/pages/${p.id}`} className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm">
                      Classic
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-text/60 dark:text-white/60">
                  No pages found. Create your first page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
