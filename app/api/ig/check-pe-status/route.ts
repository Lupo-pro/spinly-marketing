import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'
import { getPost } from '@/lib/posteverywhere/client'

export const maxDuration = 30

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

// PE reports a completed destination as 'done' (observed live), older docs
// said 'published' — accept both or posts stay stuck in 'publishing' forever.
function isDestPublished(s: string): boolean {
  return s === 'published' || s === 'done'
}

function deriveStatus(destinations: { status: string }[]): string {
  if (destinations.length === 0) return 'queued'
  const allPublished = destinations.every((d) => isDestPublished(d.status))
  const anyPublished = destinations.some((d) => isDestPublished(d.status))
  const allFailed = destinations.every((d) => d.status === 'failed')
  if (allPublished) return 'published'
  if (anyPublished) return 'partial'
  if (allFailed) return 'failed'
  return 'publishing'
}

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
  const { data: post } = await supabase.from('ig_posts').select('*').eq('id', postId).single()

  if (!post?.pe_post_id) {
    return NextResponse.json({ error: 'Post not yet sent to PostEverywhere' }, { status: 400 })
  }

  try {
    const peData = await getPost(post.pe_post_id)
    const newStatus = deriveStatus(peData.destinations || [])

    await supabase
      .from('ig_posts')
      .update({
        pe_status: newStatus,
        pe_destinations: peData.destinations,
        pe_published_at: newStatus === 'published' ? new Date().toISOString() : post.pe_published_at,
        pe_last_check_at: new Date().toISOString()
      })
      .eq('id', postId)

    return NextResponse.json({
      ok: true,
      pe_status: newStatus,
      destinations: peData.destinations
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
