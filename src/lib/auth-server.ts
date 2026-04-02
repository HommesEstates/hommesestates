'use server'

import { cookies } from 'next/headers'
import { verifySession, SessionUser } from './auth'
import { NextRequest } from 'next/server'

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-session')?.value

  if (!token) return null

  return verifySession(token)
}

export async function requireAuth(request?: NextRequest): Promise<SessionUser | null> {
  // For API routes, check the request headers/cookies
  if (request) {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null
    
    const match = cookieHeader.match(/admin-session=([^;]+)/)
    if (!match) return null
    
    const token = match[1]
    return verifySession(token)
  }
  
  // For server components/actions, use the cookie store
  return getSession()
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('admin-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-session')
}
