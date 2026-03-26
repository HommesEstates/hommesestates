import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

/**
 * Next.js API proxy for FastAPI backend
 * Forwards all requests to the FastAPI backend while handling CORS
 */
async function forward(req: NextRequest) {
  if (!FASTAPI_URL) {
    return NextResponse.json({ error: 'FASTAPI_URL not configured' }, { status: 500 })
  }

  const { pathname, search } = new URL(req.url)
  // pathname like /api/backend/<segments>
  const segments = pathname.replace(/^\/api\/backend\/?/, '')
  const targetUrl = `${FASTAPI_URL}/${segments}${search || ''}`

  const method = req.method
  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
  }

  // Forward authorization header if present
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  // Forward cookies for session-based auth
  const incomingCookie = req.headers.get('cookie') || ''
  if (incomingCookie) {
    headers['cookie'] = incomingCookie
  }

  let body: BodyInit | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = headers['Content-Type']
    if (contentType && contentType.includes('application/json')) {
      const json = await req.json().catch(() => undefined)
      body = json ? JSON.stringify(json) : undefined
    } else if (contentType?.includes('multipart/form-data')) {
      // Handle file uploads
      const formData = await req.formData().catch(() => null)
      if (formData) {
        body = formData as any
        // Let fetch set the correct content-type with boundary
        delete headers['Content-Type']
      }
    } else {
      body = await req.arrayBuffer()
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'follow',
    })

    const contentType = res.headers.get('content-type') || ''
    const setCookie = res.headers.get('set-cookie') || undefined

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      // Try to parse as JSON error
      try {
        const errJson = JSON.parse(errText)
        return NextResponse.json(errJson, { status: res.status })
      } catch {
        return NextResponse.json(
          { error: 'Backend error', status: res.status, message: errText },
          { status: res.status }
        )
      }
    }

    const init: ResponseInit = { status: res.status, headers: {} }
    if (setCookie) {
      (init.headers as Record<string, string>)['set-cookie'] = setCookie
    }

    if (contentType.includes('application/json')) {
      const data = await res.json()
      return NextResponse.json(data, init)
    }

    // Handle binary responses (file downloads)
    const buf = Buffer.from(await res.arrayBuffer())
    const respHeaders: Record<string, string> = { 'content-type': contentType }
    
    // Forward content-disposition for downloads
    const contentDisposition = res.headers.get('content-disposition')
    if (contentDisposition) {
      respHeaders['content-disposition'] = contentDisposition
    }
    
    if (setCookie) respHeaders['set-cookie'] = setCookie
    return new NextResponse(buf, { status: res.status, headers: respHeaders })
  } catch (e: any) {
    console.error('FastAPI proxy error:', e)
    return NextResponse.json(
      { error: 'Network error', message: e?.message || 'Failed to connect to backend' },
      { status: 502 }
    )
  }
}

export async function GET(req: NextRequest) { return forward(req) }
export async function POST(req: NextRequest) { return forward(req) }
export async function PUT(req: NextRequest) { return forward(req) }
export async function PATCH(req: NextRequest) { return forward(req) }
export async function DELETE(req: NextRequest) { return forward(req) }
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
