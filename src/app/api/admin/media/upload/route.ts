import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Sharp from 'sharp'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/auth'
import path from 'path'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'EDITOR')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const filenameSafe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9-_.]/g, '_')}`

    const uploadRoot = path.join(process.cwd(), 'public', 'uploads')
    const origDir = path.join(uploadRoot, 'original')
    const thumbDir = path.join(uploadRoot, 'thumb')
    await fs.mkdir(origDir, { recursive: true })
    await fs.mkdir(thumbDir, { recursive: true })

    const origPath = path.join(origDir, filenameSafe)
    await fs.writeFile(origPath, buffer)

    let thumbPublicUrl: string | null = null
    let width: number | undefined
    let height: number | undefined
    if (file.type.startsWith('image/')) {
      const image = Sharp(buffer)
      const meta = await image.metadata()
      width = meta.width || undefined
      height = meta.height || undefined
      const thumbBuf = await image.resize(400).webp({ quality: 80 }).toBuffer()
      const thumbFilename = `${filenameSafe}.webp`
      const thumbPath = path.join(thumbDir, thumbFilename)
      await fs.writeFile(thumbPath, thumbBuf)
      thumbPublicUrl = `/uploads/thumb/${thumbFilename}`
    }

    const publicUrl = `/uploads/original/${filenameSafe}`

    const saved = await prisma.media.create({
      data: {
        filename: filenameSafe,
        originalName: file.name,
        url: publicUrl,
        thumbnailUrl: thumbPublicUrl,
        type: file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT',
        category: 'OTHER',
        mimeType: file.type,
        size: buffer.length,
        width: width as any,
        height: height as any,
        tags: [],
        uploadedById: session.id,
      },
    })

    return NextResponse.json(saved)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 400 })
  }
}
