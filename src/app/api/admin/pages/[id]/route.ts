import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

const updateSchema = z.object({
  title: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['DRAFT','PUBLISHED','ARCHIVED']).optional(),
  isHomepage: z.boolean().optional(),
})

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(page)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const data = updateSchema.parse(body)

    if (data.isHomepage) {
      await prisma.page.updateMany({ data: { isHomepage: false }, where: { isHomepage: true } })
    }

    const { id } = await params
    const updated = await prisma.page.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params
    await prisma.page.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
