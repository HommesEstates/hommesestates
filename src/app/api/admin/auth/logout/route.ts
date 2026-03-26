import { NextResponse } from 'next/server'
import { clearSession, getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getSession()

    if (session) {
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: session.id,
          action: 'LOGOUT',
          entityType: 'User',
          entityId: session.id,
        },
      })
    }

    await clearSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
