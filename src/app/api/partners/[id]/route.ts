import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: raw } = await params
    const key: any = Number.isNaN(Number(raw)) ? raw : Number(raw)
    const body = await req.json()
    const data: any = {}
    if (typeof body?.name === 'string') data.name = body.name
    if (typeof body?.logoUrl === 'string') data.logoUrl = body.logoUrl
    if (typeof body?.website === 'string') data.website = body.website
    if (typeof body?.isActive === 'boolean') data.isActive = body.isActive
    if (typeof body?.order === 'number') data.order = body.order
    const updated = await prisma.partner.update({ where: { id: key } as any, data })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: raw } = await params
    const key: any = Number.isNaN(Number(raw)) ? raw : Number(raw)
    await prisma.partner.delete({ where: { id: key } as any })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 })
  }
}
