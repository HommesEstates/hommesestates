import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Allow login page (with optional trailing slash or query)
    if (pathname.startsWith('/admin/login')) {
      return NextResponse.next()
    }

    // Check authentication
    const token = request.cookies.get('admin-session')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const session = await verifySession(token)

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check role-based access
    const rank = (role: string) => (
      role === 'ADMIN' ? 5 : role === 'EDITOR' ? 4 : role === 'DESIGNER' ? 3 : role === 'PROPERTY_MANAGER' ? 2 : 1
    )
    const requireRole = (minRole: 'ADMIN' | 'EDITOR' | 'DESIGNER' | 'PROPERTY_MANAGER' | 'VIEWER') =>
      rank(session.role) >= rank(minRole)

    if (pathname.startsWith('/admin/users') && !requireRole('ADMIN')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (pathname.startsWith('/admin/settings') && !requireRole('ADMIN')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (pathname.startsWith('/admin/theme') && !requireRole('DESIGNER')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (
      (pathname.startsWith('/admin/seo') ||
        pathname.startsWith('/admin/pages') ||
        pathname.startsWith('/admin/navigation') ||
        pathname.startsWith('/admin/partners') ||
        pathname.startsWith('/admin/testimonials') ||
        pathname.startsWith('/admin/media')) &&
      !requireRole('EDITOR')
    ) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
