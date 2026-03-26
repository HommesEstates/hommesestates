import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const secret = searchParams.get('secret')
  if (!secret || secret !== process.env.PREVIEW_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }
  const dm = await draftMode()
  dm.enable()
  const redirect = searchParams.get('redirect') || '/'
  return NextResponse.redirect(new URL(redirect, req.nextUrl.origin))
}
