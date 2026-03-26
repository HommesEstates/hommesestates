import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') || '/'
  const dm = draftMode() as any
  dm.enable()
  const url = new URL(path, req.url)
  return NextResponse.redirect(url)
}
