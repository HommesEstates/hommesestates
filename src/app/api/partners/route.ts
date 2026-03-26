import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')
  const where: any = {}
  if (active === '1' || active === 'true') where.isActive = true
  const partners = await prisma.partner.findMany({ where, orderBy: { order: 'asc' } })
  return NextResponse.json(partners)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const created = await prisma.partner.create({
      data: {
        name,
        logoUrl: body?.logoUrl || '',
        website: body?.website || '',
        isActive: Boolean(body?.isActive),
        order: typeof body?.order === 'number' ? body.order : 0,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }
}
