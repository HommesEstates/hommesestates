import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

const schema = z.object({
  location: z.string().min(1),
  parentId: z.string().nullable().optional(),
  orderedIds: z.array(z.string().min(1)).min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { location, parentId = null, orderedIds } = schema.parse(body)

    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.navigationLink.update({ where: { id }, data: { position: idx, parentId, location } })
      )
    )

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
