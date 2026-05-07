import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  collectStatsForPost,
  collectAllPendingStats
} from '@/lib/stats/collector'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

// Manual trigger for stats collection. With body { postId }: refreshes that
// single post. Without body: refreshes every published post that's stale.
export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {}
      }
    }
  )
  const {
    data: { user }
  } = await supabaseAuth.auth.getUser()
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const postId = body?.postId as string | undefined

  if (postId) {
    const result = await collectStatsForPost(postId)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  }

  const result = await collectAllPendingStats()
  return NextResponse.json({ ok: true, ...result })
}
