'use client'

import { useEffect, useRef } from 'react'
import { setToken } from '@/lib/backend'

export default function KeycloakProvider({ children }: { children: React.ReactNode }) {
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let interval: any

    ;(async () => {
      try {
        const { default: Keycloak } = await import('keycloak-js')
        const url = process.env.NEXT_PUBLIC_KEYCLOAK_URL
        const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM
        const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
        if (!url || !realm || !clientId) {
          return
        }
        const kc = new Keycloak({ url, realm, clientId })
        await kc.init({
          onLoad: 'check-sso',
          pkceMethod: 'S256',
          silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        })
        if (kc.authenticated && kc.token) setToken(kc.token)
        interval = setInterval(async () => {
          try {
            if (!kc.authenticated) return
            const updated = await kc.updateToken(60)
            if (updated && kc.token) setToken(kc.token)
          } catch (_) {}
        }, 30000)
      } catch (_) {
        // keycloak optional; fail silently if not configured
      }
    })()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  return <>{children}</>
}
