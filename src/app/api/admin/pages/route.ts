import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/auth'

const createPageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  isHomepage: z.boolean().optional(),
})

export async function GET() {
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: 'desc' } })
  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const { title, slug, description, isHomepage } = createPageSchema.parse(body)

    if (isHomepage) {
      // Ensure only one homepage
      await prisma.page.updateMany({ data: { isHomepage: false }, where: { isHomepage: true } })
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        description: description || null,
        status: 'DRAFT',
        isHomepage: Boolean(isHomepage),
        authorId: session.id,
      },
      select: { id: true },
    })

    return NextResponse.json(page)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
