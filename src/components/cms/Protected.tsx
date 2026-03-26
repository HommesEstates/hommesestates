"use client"
import { ReactNode, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
export default function Protected({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (!data.session) router.replace('/admin/login')
      else setReady(true)
    })
  }, [router])
  if (!ready) return null
  return <>{children}</>
}
