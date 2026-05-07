import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'
import { publishToPostEverywhere, type Platform } from '@/lib/posteverywhere/publisher'

export const maxDuration = 300

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

export async function POST(req: Request) {
  // Cookie-based admin gate — only Lupo can trigger publish.
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
  const platforms = body?.platforms as Platform[] | undefined
  const scheduledFor = body?.scheduledFor as string | undefined
  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 })
  }

  const supabase = getServerSupabase()
  const { data: post, error: fetchErr } = await supabase
    .from('ig_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (fetchErr || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (post.status !== 'approved') {
    return NextResponse.json(
      { error: 'Post must be approved before publishing' },
      { status: 400 }
    )
  }
  if (post.pe_status === 'published' || post.pe_status === 'scheduled') {
    return NextResponse.json(
      { error: `Post already ${post.pe_status}` },
      { status: 400 }
    )
  }

  const result = await publishToPostEverywhere(post, { platforms, scheduledFor })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    pe_post_id: result.pe_post_id,
    destinations: result.destinations
  })
}
