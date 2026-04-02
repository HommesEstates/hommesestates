import { ReactNode } from 'react'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'
import { getSession } from '@/lib/auth-server'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getSession()
  
  // If not authenticated, render children without admin layout
  // This allows login page to render without sidebar/header
  if (!session) {
    return <>{children}</>
  }
  
  // If authenticated, render full admin layout using client component
  return (
    <AdminLayoutClient session={session}>
      {children}
    </AdminLayoutClient>
  )
}
