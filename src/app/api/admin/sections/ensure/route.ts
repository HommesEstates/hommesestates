import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/auth'

const getSchema = z.object({ slug: z.string().min(1), key: z.string().min(1) })
const postSchema = z.object({ slug: z.string().min(1), key: z.string().min(1), type: z.string().min(1), defaults: z.any() })

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parse = getSchema.safeParse({ slug: searchParams.get('slug'), key: searchParams.get('key') })
  if (!parse.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  const { slug, key } = parse.data

  const page = await prisma.page.findUnique({ where: { slug } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  const section = await prisma.section.findFirst({ where: { pageId: page.id, title: key } })
  if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })
  return NextResponse.json(section)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { slug, key, type, defaults } = postSchema.parse(body)

    let page = await prisma.page.findUnique({ where: { slug } })
    if (!page) {
      page = await prisma.page.create({ data: { slug, title: slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()), status: 'DRAFT', authorId: session.id } })
    }

    let section = await prisma.section.findFirst({ where: { pageId: page.id, title: key } })
    if (!section) {
      section = await prisma.section.create({ data: { pageId: page.id, type: type as any, title: key, content: defaults, order: 0, isVisible: true, authorId: session.id } })
    }

    return NextResponse.json(section)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
