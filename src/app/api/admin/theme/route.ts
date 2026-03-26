import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

export async function GET() {
  let theme = await prisma.themeSettings.findFirst({ where: { isActive: true } })
  if (!theme) {
    theme = await prisma.themeSettings.create({
      data: {
        name: 'Default',
        colors: { primary: '#8C6239', secondary: '#1B5E20', accent: '#A67C52', muted: '#F3F4F6' },
        typography: { body: 'Inter', heading: 'Playfair Display' },
        spacing: { container: 'max-w-7xl' },
        borderRadius: { base: '0.75rem' },
        animations: { duration: 200 },
        layout: { sectionPadding: 'py-16' },
        isActive: true,
      },
    })
  }
  return NextResponse.json(theme)
}

const schema = z.object({
  colors: z.any().optional(),
  typography: z.any().optional(),
  spacing: z.any().optional(),
  borderRadius: z.any().optional(),
  animations: z.any().optional(),
  layout: z.any().optional(),
})

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'DESIGNER')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const data = schema.parse(body)
    const current = await prisma.themeSettings.findFirst({ where: { isActive: true } })
    if (!current) {
      const created = await prisma.themeSettings.create({ data: { name: 'Default', ...data, isActive: true } as any })
      return NextResponse.json(created)
    }
    const updated = await prisma.themeSettings.update({ where: { id: current.id }, data: data as any })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
