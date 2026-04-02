import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

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
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null
  return verifySession(token)
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
