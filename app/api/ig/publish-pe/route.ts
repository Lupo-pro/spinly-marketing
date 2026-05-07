import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'
import { publishToPostEverywhere, type Platform } from '@/lib/posteverywhere/publisher'

// Vercel Hobby caps function duration at 60s regardless of declared value.
// Setting 60 explicitly so the code matches real runtime budget.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

// Statuses that mean "PE already saw this post" — block any retry.
// Includes 'failed' because PE's createPost is async on their side; a Vercel
// timeout after the request reached PE can leave us in 'failed' even though PE
// kept processing. Use Reset State to clear before retrying intentionally.
const BLOCKED_STATUSES = new Set([
  'queued',
  'scheduled',
  'publishing',
  'published',
  'partial',
  'failed'
])

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

  // Anti-duplicate: refuse if PE already has any non-null state, OR if a
  // pe_post_id was saved. Both are guarded by Reset State.
  if (post.pe_post_id || (post.pe_status && BLOCKED_STATUSES.has(post.pe_status))) {
    return NextResponse.json(
      {
        error: `Cette publication est déjà en cours (pe_status=${post.pe_status ?? 'set'}). Si tu veux republier, fais "Reset state" d'abord.`,
        pe_status: post.pe_status,
        pe_post_id: post.pe_post_id
      },
      { status: 409 }
    )
  }

  // Atomic lock: set pe_status='publishing' ONLY if it's still null. If two
  // concurrent requests race, the second UPDATE matches zero rows and we abort.
  // This protects against double-clicks racing past the read above.
  const lockNow = new Date().toISOString()
  const { data: locked, error: lockError } = await supabase
    .from('ig_posts')
    .update({
      pe_status: 'publishing',
      pe_error: null,
      pe_last_check_at: lockNow
    })
    .eq('id', postId)
    .is('pe_status', null)
    .select('id')

  if (lockError) {
    return NextResponse.json(
      { error: `Failed to acquire publish lock: ${lockError.message}` },
      { status: 500 }
    )
  }
  if (!locked || locked.length === 0) {
    // Another request already grabbed the lock between our SELECT and UPDATE.
    const { data: current } = await supabase
      .from('ig_posts')
      .select('pe_status, pe_post_id')
      .eq('id', postId)
      .single()
    return NextResponse.json(
      {
        error: `Publication concurrente détectée (pe_status=${current?.pe_status ?? 'unknown'}). Recharge la page.`,
        pe_status: current?.pe_status,
        pe_post_id: current?.pe_post_id
      },
      { status: 409 }
    )
  }

  // From here on, pe_status='publishing' is set in DB. If Vercel times out,
  // the next click will see pe_status='publishing' and be blocked by the
  // BLOCKED_STATUSES guard above — no double-publish.
  try {
    const result = await publishToPostEverywhere(post, { platforms, scheduledFor })
    if (!result.ok) {
      // publisher.ts already wrote pe_status='failed' on its catch path.
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      pe_post_id: result.pe_post_id,
      destinations: result.destinations
    })
  } catch (err) {
    // Unhandled error — make sure pe_status doesn't stay 'publishing' forever.
    // (If we leave it 'publishing' the user can't retry without Reset state,
    // which is actually what we want when PE may have processed the post.)
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[publish-pe] unhandled error postId=${postId}: ${errorMsg}`)
    await supabase
      .from('ig_posts')
      .update({ pe_status: 'failed', pe_error: errorMsg })
      .eq('id', postId)
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 })
  }
}
