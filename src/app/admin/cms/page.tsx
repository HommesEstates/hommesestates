import React from 'react'
import Link from 'next/link'
import { sanityClient } from '@/lib/sanity.config'
import { pagesCountQuery, recentEditsQuery } from '@/lib/queries'

export default async function CmsAdminDashboard() {
  const [pagesCount, recent] = await Promise.all([
    (sanityClient.fetch as any)(pagesCountQuery) as Promise<number>,
    (sanityClient.fetch as any)(recentEditsQuery) as Promise<any[]>,
  ])

  return (
    <main className="section-container">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h1">CMS Admin Dashboard</h1>
        <Link href="/studio" className="btn-primary">Open Studio</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="stats-card">
          <div className="text-sm text-neutral-500">Pages</div>
          <div className="text-3xl font-bold mt-2">{pagesCount || 0}</div>
        </div>
        <div className="stats-card">
          <div className="text-sm text-neutral-500">Partners</div>
          <div className="text-3xl font-bold mt-2">—</div>
        </div>
        <div className="stats-card">
          <div className="text-sm text-neutral-500">Testimonials</div>
          <div className="text-3xl font-bold mt-2">—</div>
        </div>
        <div className="stats-card">
          <div className="text-sm text-neutral-500">Pending Updates</div>
          <div className="text-3xl font-bold mt-2">—</div>
        </div>
      </div>

      <section>
        <h2 className="text-h2 mb-4">Recent Edits</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Title</th>
                <th className="text-left p-3">Slug</th>
                <th className="text-left p-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(recent || []).map((r) => (
                <tr key={r._id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="p-3">{r._type}</td>
                  <td className="p-3">{r.title || '—'}</td>
                  <td className="p-3">{r.slug || '—'}</td>
                  <td className="p-3">{new Date(r._updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {!recent?.length && (
                <tr>
                  <td className="p-3" colSpan={4}>No edits yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-h2 mb-3">Quick Actions</h2>
        <div className="flex gap-3">
          <Link href="/studio/structure" className="btn-secondary">Create Page</Link>
          <Link href="/studio" className="btn-secondary">Upload Media</Link>
          <Link href="/studio" className="btn-secondary">View Drafts</Link>
        </div>
      </section>
    </main>
  )
}
