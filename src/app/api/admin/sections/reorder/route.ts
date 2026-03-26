import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

const schema = z.object({
  pageId: z.string().min(1),
  order: z.array(z.object({ id: z.string(), order: z.number().int().nonnegative() })),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const data = schema.parse(body)

    await prisma.$transaction(
      data.order.map((s: { id: string; order: number }) =>
        prisma.section.update({ where: { id: s.id }, data: { order: s.order } })
      )
    )

    const sections = await prisma.section.findMany({ where: { pageId: data.pageId }, orderBy: { order: 'asc' } })
    return NextResponse.json(sections)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
