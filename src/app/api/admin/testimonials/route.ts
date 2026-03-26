import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  quote: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  avatarUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET() {
  const items = await prisma.testimonial.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const data = createSchema.parse(body)

    const last = await prisma.testimonial.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
    const created = await prisma.testimonial.create({ data: { ...data, isActive: data.isActive ?? true, order: (last?.order ?? -1) + 1 } })
    return NextResponse.json(created)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
