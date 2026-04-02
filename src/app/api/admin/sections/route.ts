import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/auth'

const createSchema = z.object({
  pageId: z.string().min(1),
  type: z.enum([
    'HERO', 'TEXT_BLOCK', 'IMAGE_GALLERY', 'VIDEO', 'CAROUSEL', 'TESTIMONIALS', 'PARTNERS', 'CTA', 'FEATURES', 'STATS', 'CONTACT_FORM', 'MAP', 'PROPERTIES_GRID', 'CUSTOM'
  ]),
  title: z.string().optional(),
  content: z.any(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pageId = searchParams.get('pageId')
  if (!pageId) return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
  const sections = await prisma.section.findMany({ where: { pageId }, orderBy: { order: 'asc' } })
  return NextResponse.json(sections)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const data = createSchema.parse(body)

    const last = await prisma.section.findFirst({
      where: { pageId: data.pageId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const section = await prisma.section.create({
      data: {
        pageId: data.pageId,
        type: data.type,
        title: data.title || null,
        content: data.content,
        order: (last?.order ?? -1) + 1,
        isVisible: true,
        authorId: session.id,
      },
    })

    return NextResponse.json(section)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
