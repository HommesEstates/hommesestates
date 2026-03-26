import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

function buildTree(items: any[]) {
  const byId = new Map<string, any>()
  items.forEach((i) => byId.set(i.id, { ...i, children: [] }))
  const roots: any[] = []
  byId.forEach((node) => {
    if (node.parentId) {
      const parent = byId.get(node.parentId)
      if (parent) parent.children.push(node)
      else roots.push(node)
    } else {
      roots.push(node)
    }
  })
  // sort children by position
  const sortRec = (n: any) => {
    n.children.sort((a: any, b: any) => a.position - b.position)
    n.children.forEach(sortRec)
  }
  roots.sort((a, b) => a.position - b.position)
  roots.forEach(sortRec)
  return roots
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location') || 'header'
  const nested = searchParams.get('nested') === 'true'
  const items = await prisma.navigationLink.findMany({
    where: { location },
    orderBy: [{ position: 'asc' }],
  })
  if (nested) return NextResponse.json(buildTree(items))
  return NextResponse.json(items)
}

const createSchema = z.object({
  location: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  visible: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const data = createSchema.parse(body)

    const last = await prisma.navigationLink.findFirst({
      where: { location: data.location, parentId: data.parentId ?? null },
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const link = await prisma.navigationLink.create({
      data: {
        location: data.location,
        label: data.label,
        href: data.href,
        visible: data.visible ?? true,
        parentId: data.parentId ?? null,
        position: (last?.position ?? -1) + 1,
      },
    })

    return NextResponse.json(link)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
