import { NextResponse } from 'next/server'
import { publishCarousel } from '@/lib/instagram/publisher'

export const maxDuration = 300

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const postId = body?.postId as string | undefined
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  const result = await publishCarousel(postId)
  return NextResponse.json(result)
}
