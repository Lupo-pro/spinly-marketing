import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

// JSON-friendly reject endpoint used by the swipe Pilot UI. The existing
// rejectPost server action takes a FormData and redirects, which doesn't fit
// a fetch-from-client flow — keep both, they serve different surfaces.
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
  const reason = (body?.reason as string | undefined) ?? null
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const supabase = getServerSupabase()
  const { error } = await supabase
    .from('ig_posts')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', postId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
