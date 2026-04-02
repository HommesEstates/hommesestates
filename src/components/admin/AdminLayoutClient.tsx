'use client'

import { EnterpriseSidebar } from './EnterpriseSidebar'
import { EnterpriseHeader } from './EnterpriseHeader'
import { type SessionUser } from '@/lib/auth'

interface AdminLayoutClientProps {
  children: React.ReactNode
  session: SessionUser
}

export function AdminLayoutClient({ children, session }: AdminLayoutClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-accent/5 dark:from-[#030712] dark:via-[#030712] dark:to-accent/10">
      {/* Decorative gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-64 -right-64 w-[40rem] h-[40rem] bg-accent/5 dark:bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-64 -left-64 w-[30rem] h-[30rem] bg-accent/5 dark:bg-accent/10 rounded-full blur-[80px]" />
      </div>
      
      <EnterpriseSidebar user={session} />
      
      <div className="lg:pl-72 relative z-0">
        <EnterpriseHeader user={session} />
        
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
