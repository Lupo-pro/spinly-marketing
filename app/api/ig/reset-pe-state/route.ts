import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

// Wipes all pe_* fields on an ig_posts row so the post becomes publishable
// again via /api/ig/publish-pe. Intended for clearing a 'failed' state after
// the user has confirmed nothing actually shipped on PostEverywhere — e.g.
// after deleting duplicates from Instagram manually.
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
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { error } = await supabase
    .from('ig_posts')
    .update({
      pe_post_id: null,
      pe_status: null,
      pe_scheduled_for: null,
      pe_published_at: null,
      pe_destinations: null,
      pe_error: null,
      pe_last_check_at: null
    })
    .eq('id', postId)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
