import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
)

export interface SessionUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'DESIGNER' | 'PROPERTY_MANAGER' | 'VIEWER'
  avatar?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload.user as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin-session')?.value

  if (!token) return null

  return verifySession(token)
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

export function hasPermission(
  userRole: SessionUser['role'],
  requiredRole: SessionUser['role']
): boolean {
  const roleHierarchy = {
    ADMIN: 5,
    EDITOR: 4,
    DESIGNER: 3,
    PROPERTY_MANAGER: 2,
    VIEWER: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
