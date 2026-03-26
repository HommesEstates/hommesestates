import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const active = searchParams.get('active')
  const where: any = {}
  if (active === '1' || active === 'true') where.isActive = true
  const testimonials = await prisma.testimonial.findMany({ where, orderBy: { order: 'asc' } })
  return NextResponse.json(testimonials)
}
