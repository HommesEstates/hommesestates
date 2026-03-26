import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pageId = searchParams.get('pageId')
  if (!pageId) return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
  const page = await prisma.page.findUnique({ where: { id: pageId } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  let seo = await prisma.seoSettings.findUnique({ where: { pageId } })
  if (!seo) {
    seo = await prisma.seoSettings.create({
      data: {
        pageId,
        metaTitle: page.title,
        metaDescription: page.description || '',
        keywords: [],
        authorId: page.authorId,
      },
    })
  }
  return NextResponse.json(seo)
}

const schema = z.object({
  metaTitle: z.string().min(1),
  metaDescription: z.string().optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),
  ogImage: z.string().optional().nullable(),
  twitterCard: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  noindex: z.boolean().optional(),
  nofollow: z.boolean().optional(),
})

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { searchParams } = new URL(req.url)
    const pageId = searchParams.get('pageId')
    if (!pageId) return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    const body = await req.json()
    const data = schema.parse(body)
    const updated = await prisma.seoSettings.update({ where: { pageId }, data })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
