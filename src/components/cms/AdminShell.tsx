"use client"
import { ReactNode } from 'react'
import Link from 'next/link'
import Sidebar from './Sidebar'
export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-charcoal">
      <Sidebar />
      <div className="flex-1">
        <div className="h-16 border-b flex items-center justify-between px-4">
          <Link href="/admin" className="font-heading font-bold">Hommes CMS</Link>
          <div className="text-sm">
            <Link href="/admin/settings" className="px-3 py-1 border rounded">Settings</Link>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
