import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getSession, hasPermission } from '@/lib/auth'

const schema = z.object({
  siteName: z.string().optional(),
  tagline: z.string().optional(),
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  socialLinks: z.any().optional().nullable(),
  googleAnalyticsId: z.string().optional().nullable(),
  googleMapsApiKey: z.string().optional().nullable(),
  odooApiUrl: z.string().optional().nullable(),
  odooApiKey: z.string().optional().nullable(),
  maintenanceMode: z.boolean().optional(),
})

export async function GET() {
  let settings = await prisma.siteSettings.findFirst()
  if (!settings) settings = await prisma.siteSettings.create({ data: {} })
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session.role, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const data = schema.parse(body)
    const current = await prisma.siteSettings.findFirst()
    let saved
    if (!current) saved = await prisma.siteSettings.create({ data: data as any })
    else saved = await prisma.siteSettings.update({ where: { id: current.id }, data: data as any })
    return NextResponse.json(saved)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
