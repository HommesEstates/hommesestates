import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const ODOO_BASE = process.env.ODOO_API_URL || process.env.NEXT_PUBLIC_ODOO_API_URL
const ODOO_API_KEY = process.env.ODOO_API_KEY
const ODOO_DB = process.env.ODOO_DB || process.env.NEXT_PUBLIC_ODOO_DB || process.env.ODOO_DB_NAME
const ODOO_LOGIN = process.env.ODOO_LOGIN || process.env.ODOO_USERNAME
const ODOO_PASSWORD = process.env.ODOO_PASSWORD
const ODOO_ALT_BASE = process.env.ODOO_URL || process.env.NEXT_PUBLIC_ODOO_URL
const FETCH_TIMEOUT_MS = 8000

// Validate required environment variables
function validateConfig() {
  const missing = []
  if (!ODOO_BASE && !ODOO_ALT_BASE) missing.push('ODOO_API_URL')
  if (!ODOO_API_KEY) missing.push('ODOO_API_KEY')
  if (!ODOO_DB) missing.push('ODOO_DB')
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

function normalizeBase(value?: string | null) {
  return (value || '').replace(/\/$/, '')
}

function getBaseCandidates() {
  const values = [normalizeBase(ODOO_BASE), normalizeBase(ODOO_ALT_BASE)].filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value)
      out.push(value)
    }
    const withoutOdoo = value.replace(/\/odoo$/i, '')
    if (withoutOdoo && !seen.has(withoutOdoo)) {
      seen.add(withoutOdoo)
      out.push(withoutOdoo)
    }
  }

  return out
}

function isPublicApiRequest(method: string, segments: string) {
  return (method === 'GET' || method === 'HEAD') && /^api\//i.test(segments)
}

async function fetchWithTimeout(input: string, init: RequestInit) {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
}

async function forward(req: NextRequest) {
  // Validate config on first request
  try {
    validateConfig()
  } catch (e: any) {
    return NextResponse.json({ error: 'Configuration error', message: e.message }, { status: 500 })
  }

  if ((!ODOO_BASE && !ODOO_ALT_BASE) || !ODOO_API_KEY) {
    return NextResponse.json({ error: 'ODOO_API_URL and ODOO_API_KEY must be configured' }, { status: 500 })
  }

  const { pathname, search } = new URL(req.url)
  const segments = pathname.replace(/^\/api\/odoo\/?/, '')
  const baseCandidates = getBaseCandidates()

  console.log('[API Route] ODOO_BASE:', ODOO_BASE)
  console.log('[API Route] ODOO_ALT_BASE:', ODOO_ALT_BASE)
  console.log('[API Route] baseCandidates:', baseCandidates)
  console.log('[API Route] segments:', segments)
  console.log('[API Route] search:', search)

  const method = req.method
  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
    'Authorization': `Bearer ${ODOO_API_KEY}`,
    'X-Api-Key': ODOO_API_KEY,
    'api-key': ODOO_API_KEY,
  }
  if (ODOO_DB) {
    headers['X-Odoo-Db'] = ODOO_DB
    headers['db'] = ODOO_DB
  }
  // Fallback to login/password if API key auth fails (for backward compatibility)
  if (ODOO_LOGIN) headers['login'] = ODOO_LOGIN
  if (ODOO_PASSWORD) headers['password'] = ODOO_PASSWORD
  // Forward incoming cookies so Odoo session works through the proxy
  const incomingCookie = req.headers.get('cookie') || ''
  if (incomingCookie) headers['cookie'] = incomingCookie

  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = headers['Content-Type']
    if (contentType && contentType.includes('application/json')) {
      const json = await req.json().catch(() => undefined)
      body = json ? JSON.stringify(json) : undefined
    } else {
      body = await req.arrayBuffer()
    }
  }

  // Session primer removed: API-key and header auth should suffice for REST gateway
  let primerSetCookie: string | null = null

  let sessionCookie: string | null = null
  if (!isPublicApiRequest(method, segments) && ODOO_LOGIN && ODOO_PASSWORD && ODOO_DB && baseCandidates.length > 0) {
    try {
      const authBase = baseCandidates[0]
      const authUrl = `${authBase}/web/session/authenticate`
      const authBody = JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: ODOO_DB,
          login: ODOO_LOGIN,
          password: ODOO_PASSWORD,
        },
        id: Math.floor(Math.random() * 1000000),
      })
      console.log('[API Route] Authenticating at:', authUrl)
      const authRes = await fetchWithTimeout(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: authBody,
        cache: 'no-store',
      })
      const setCookie = authRes.headers.get('set-cookie')
      if (setCookie) {
        sessionCookie = setCookie
        console.log('[API Route] Got session cookie')
      } else {
        console.log('[API Route] No session cookie, status:', authRes.status)
      }
    } catch (e) {
      console.log('[API Route] Auth error:', e)
    }
  }

  try {
    const fetchHeaders: Record<string, string> = { ...headers }
    if (sessionCookie) fetchHeaders['cookie'] = sessionCookie
    let res: Response | null = null
    let fallbackRes: Response | null = null
    let lastError: any = null

    for (const base of baseCandidates) {
      const candidates = [`${base}/${segments}${search || ''}`]
      const needsPrefix = !/\/odoo\/?$/i.test(base) && !/^odoo\//i.test(segments)
      if (needsPrefix) candidates.push(`${base}/odoo/${segments}${search || ''}`)

      if (!isPublicApiRequest(method, segments)) {
        const testUrl = `${base}/api/system/status`
        console.log('[API Route] Testing Odoo connectivity:', testUrl)
        try {
          const testRes = await fetchWithTimeout(testUrl, { method: 'GET', headers: fetchHeaders, cache: 'no-store', redirect: 'manual' })
          console.log('[API Route] Test response status:', testRes.status)
          console.log('[API Route] Test location:', testRes.headers.get('location'))
        } catch (e) {
          console.log('[API Route] Test error:', e)
        }
      }

      for (const targetUrl of candidates) {
        console.log('[API Route] Fetching:', targetUrl)
        try {
          const current = await fetchWithTimeout(targetUrl, {
            method,
            headers: fetchHeaders,
            body,
            cache: 'no-store',
            redirect: 'manual',
          })
          console.log('[API Route] Response status:', current.status)
          console.log('[API Route] Response location:', current.headers.get('location'))

          if (current.ok) {
            res = current
            break
          }

          if (current.status < 500 && current.status !== 404 && current.status !== 301 && current.status !== 302) {
            res = current
            break
          }

          if (current.status >= 500) {
            fallbackRes = current
            continue
          }
        } catch (e) {
          lastError = e
          console.log('[API Route] Fetch error:', e)
        }
      }

      if (res) break
    }

    if (!res && fallbackRes) {
      res = fallbackRes
    }

    if (!res) {
      throw lastError || new Error('Unable to reach configured Odoo endpoint')
    }

    const contentType = res.headers.get('content-type') || ''
    const setCookie = res.headers.get('set-cookie') || undefined

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json(
        { error: 'Upstream error', status: res.status, message: errText },
        { status: res.status }
      )
    }

    // Merge Set-Cookie headers from primer and target if present
    const init: ResponseInit = { status: res.status, headers: {} }
    const combinedSetCookie = [primerSetCookie, setCookie].filter(Boolean).join(', ')

    if (contentType.includes('application/json')) {
      const data = await res.json()
      if (combinedSetCookie) (init.headers as Record<string, string>)['set-cookie'] = combinedSetCookie
      return NextResponse.json(data, init)
    }

    const buf = Buffer.from(await res.arrayBuffer())
    const respHeaders: Record<string, string> = { 'content-type': contentType }
    if (combinedSetCookie) respHeaders['set-cookie'] = combinedSetCookie
    return new NextResponse(buf, { status: res.status, headers: respHeaders })
  } catch (e: any) {
    return NextResponse.json({ error: 'Network error', message: e?.message }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  console.log('[API Route] GET /api/odoo/', req.nextUrl.pathname)
  return forward(req)
}
export async function POST(req: NextRequest) {
  console.log('[API Route] POST /api/odoo/', req.nextUrl.pathname)
  return forward(req)
}
export async function PUT(req: NextRequest) { return forward(req) }
export async function PATCH(req: NextRequest) { return forward(req) }
export async function DELETE(req: NextRequest) { return forward(req) }
