import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const secret = searchParams.get('secret')
  if (!secret || secret !== process.env.PREVIEW_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }
  const path = searchParams.get('path') || '/'
  revalidatePath(path)
  return NextResponse.json({ revalidated: true, path })
}
