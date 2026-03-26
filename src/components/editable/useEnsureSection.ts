'use client'

import { useEffect, useState } from 'react'
import { useEditMode } from '@/components/providers/EditModeProvider'

interface Options {
  slug: string
  key: string
  type: string
  defaults: any
}

export function useEnsureSection({ slug, key, type, defaults }: Options) {
  const { isEditMode } = useEditMode()
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState<any>(null)
  const [content, setContent] = useState<any>(defaults)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        // Try to load existing section by slug/key
        const q = new URLSearchParams({ slug, key })
        const res = await fetch(`/api/admin/sections/ensure?${q.toString()}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) {
            setSection(data)
            setContent(data?.content || defaults)
          }
        } else if (res.status === 404) {
          // If in edit mode, create it on demand
          if (isEditMode) {
            const createRes = await fetch('/api/admin/sections/ensure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ slug, key, type, defaults }),
            })
            if (createRes.ok) {
              const data = await createRes.json()
              if (!cancelled) {
                setSection(data)
                setContent(data?.content || defaults)
              }
            }
          } else {
            if (!cancelled) {
              setSection(null)
              setContent(defaults)
            }
          }
        }
      } catch {
        if (!cancelled) {
          setSection(null)
          setContent(defaults)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [slug, key, type, isEditMode])

  return { loading, section, content }
}
