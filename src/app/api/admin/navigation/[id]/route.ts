import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/auth'

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  href: z.string().min(1).optional(),
  visible: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
  position: z.number().int().optional(),
  location: z.string().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const data = updateSchema.parse(body)

    const { id } = await params
    const updated = await prisma.navigationLink.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    await prisma.navigationLink.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
