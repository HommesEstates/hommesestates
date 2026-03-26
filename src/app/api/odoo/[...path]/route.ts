import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const ODOO_BASE = process.env.ODOO_API_URL || process.env.NEXT_PUBLIC_ODOO_API_URL
const ODOO_API_KEY = process.env.ODOO_API_KEY
const ODOO_DB = process.env.ODOO_DB || process.env.NEXT_PUBLIC_ODOO_DB || process.env.ODOO_DB_NAME
const ODOO_LOGIN = process.env.ODOO_LOGIN || process.env.ODOO_USERNAME
const ODOO_PASSWORD = process.env.ODOO_PASSWORD

async function forward(req: NextRequest) {
  if (!ODOO_BASE) {
    return NextResponse.json({ error: 'ODOO_API_URL not configured' }, { status: 500 })
  }

  const { pathname, search } = new URL(req.url)
  // pathname like /api/odoo/<segments>
  const segments = pathname.replace(/^\/api\/odoo\/?/, '')
  // Use base exactly as configured (e.g. http://localhost:8069), do not force '/odoo'
  const base = (ODOO_BASE || '').replace(/\/$/, '')
  // Build target URL (we do not inject db query; credentials go via headers for compatibility with send_request)
  const targetUrl = `${base}/${segments}${search || ''}`

  const method = req.method
  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
  }
  if (ODOO_API_KEY) {
    headers['Authorization'] = `Bearer ${ODOO_API_KEY}`
    headers['X-Api-Key'] = ODOO_API_KEY
    headers['api-key'] = ODOO_API_KEY
  }
  if (ODOO_DB) {
    headers['X-Odoo-Db'] = ODOO_DB
    headers['db'] = ODOO_DB
  }
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

  try {
    let res = await fetch(targetUrl, { method, headers, body, cache: 'no-store', redirect: 'follow' })
    // If upstream returns 404 and base likely needs '/odoo' prefix, retry once with '/odoo/' prefixed
    if (res.status === 404) {
      const needsPrefix = !/\/odoo\/?$/i.test(base) && !/^odoo\//i.test(segments)
      if (needsPrefix) {
        const altUrl = `${base}/odoo/${segments}${search || ''}`
        try {
          const retry = await fetch(altUrl, { method, headers, body, cache: 'no-store', redirect: 'follow' })
          if (retry.ok || retry.status !== 404) {
            res = retry
          }
        } catch {}
      }
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

export async function GET(req: NextRequest) { return forward(req) }
export async function POST(req: NextRequest) { return forward(req) }
export async function PUT(req: NextRequest) { return forward(req) }
export async function PATCH(req: NextRequest) { return forward(req) }
export async function DELETE(req: NextRequest) { return forward(req) }
