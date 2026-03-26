import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import path from 'path'
import { promises as fs } from 'fs'

const schema = z.object({
  action: z.enum(['delete', 'tag']),
  ids: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action, ids, tags = [] } = schema.parse(body)

    if (action === 'tag') {
      await prisma.media.updateMany({ where: { id: { in: ids } }, data: { tags } })
      return NextResponse.json({ success: true })
    }

    // action === 'delete' -> remove local files and DB rows
    const media = await prisma.media.findMany({ where: { id: { in: ids } }, select: { filename: true } })
    if (media.length) {
      const uploadRoot = path.join(process.cwd(), 'public', 'uploads')
      await Promise.all(
        media.flatMap((m: { filename: string }) => {
          const orig = path.join(uploadRoot, 'original', m.filename)
          const thumb = path.join(uploadRoot, 'thumb', `${m.filename}.webp`)
          return [orig, thumb].map(async (p) => {
            try { await fs.unlink(p) } catch {}
          })
        })
      )
    }

    await prisma.media.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
