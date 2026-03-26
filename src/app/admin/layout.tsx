import { ReactNode } from 'react'
import { Sidebar } from '@/components/admin/Sidebar'
import EditModeToggle from '@/components/admin/EditModeToggle'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />
      
      <main className="lg:pl-64">
        <div className="border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-end px-6 h-16 bg-white/60 dark:bg-neutral-900/60 backdrop-blur">
          <EditModeToggle />
        </div>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
