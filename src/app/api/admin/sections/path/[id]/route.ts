import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/auth'

const schema = z.object({ path: z.string().min(1), value: z.any() })

function setByPath(obj: any, path: string, value: any) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}
    cur = cur[k]
  }
  cur[parts[parts.length - 1]] = value
  return obj
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { path, value } = schema.parse(body)

    const { id } = await params
    const section = await prisma.section.findUnique({ where: { id } })
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })

    const content = typeof section.content === 'object' && section.content !== null ? { ...(section.content as any) } : {}
    const updated = setByPath(content, path, value)

    const saved = await prisma.section.update({ where: { id }, data: { content: updated } })
    return NextResponse.json(saved)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
