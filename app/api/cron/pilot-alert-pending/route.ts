import { NextResponse } from 'next/server'
import { alertPendingDrafts } from '@/lib/pilot/alerts'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Vercel Hobby caps daily cron jobs at 2 — we already have ig-generate and
// pe-status-poll. To stay under quota, this route is *also* invoked at the
// end of pe-status-poll. It remains its own URL so it can be wired to its
// own cron line if Lupo upgrades to Pro.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await alertPendingDrafts()
  return NextResponse.json({ ok: true, ...result })
}
