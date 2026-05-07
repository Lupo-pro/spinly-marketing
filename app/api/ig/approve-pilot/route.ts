import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server'
import { pilotSchedulePost } from '@/lib/pilot/scheduler'
import { publishToPostEverywhere, type Platform } from '@/lib/posteverywhere/publisher'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

// One-shot approve flow for Pilot Mode:
//   approve → render (if needed) → schedule → publish-scheduled
// Each step writes its outcome to the DB so the polling UI can follow along.
// Errors at later stages roll the post back to status='draft' to avoid having
// "approved but never publishable" zombies in the dashboard.
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
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

  const supabase = getServerSupabase()
  const { data: post, error: fetchErr } = await supabase
    .from('ig_posts')
    .select('*')
    .eq('id', postId)
    .single()
  if (fetchErr || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }
  if (post.status === 'approved' || post.status === 'rejected') {
    return NextResponse.json(
      { error: `Post already ${post.status}`, status: post.status },
      { status: 409 }
    )
  }

  // ─── 1. Approve ───
  const approveAt = new Date().toISOString()
  const { error: approveErr } = await supabase
    .from('ig_posts')
    .update({
      status: 'approved',
      approved_at: approveAt,
      approved_by: user.email ?? 'unknown'
    })
    .eq('id', postId)
  if (approveErr) {
    return NextResponse.json({ error: `Approve failed: ${approveErr.message}` }, { status: 500 })
  }

  // Helper to roll status back to draft when a downstream step fails.
  async function rollback(reason: string, http: number) {
    await supabase
      .from('ig_posts')
      .update({
        status: 'draft',
        approved_at: null,
        approved_by: null,
        pilot_scheduled_at: null,
        pilot_platforms: null
      })
      .eq('id', postId!)
    return NextResponse.json({ error: reason }, { status: http })
  }

  // ─── 2. Render (skip if already rendered) ───
  const contentType = (post.content_type ?? 'carousel') as 'carousel' | 'single_post' | 'story'
  const expectedSlides = contentType === 'carousel' ? 10 : 1
  const alreadyRendered =
    Array.isArray(post.slide_image_urls) && post.slide_image_urls.length === expectedSlides

  let slideImageUrls: string[] = post.slide_image_urls ?? []

  if (!alreadyRendered) {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return rollback('CRON_SECRET not configured', 500)

    let renderRes: Response
    try {
      renderRes = await fetch(`${baseUrl}/api/ig/render-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cronSecret}`
        },
        body: JSON.stringify({ postId }),
        cache: 'no-store'
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return rollback(`Render request failed: ${msg}`, 500)
    }

    const renderData = await renderRes.json().catch(() => ({}))
    if (!renderRes.ok) {
      return rollback(
        `Render failed: ${renderData?.error ?? `HTTP ${renderRes.status}`}`,
        500
      )
    }
    if (!Array.isArray(renderData.urls) || renderData.urls.length !== expectedSlides) {
      return rollback(
        `Render incomplete: ${renderData.urls?.length ?? 0}/${expectedSlides} slides`,
        500
      )
    }
    slideImageUrls = renderData.urls as string[]
  }

  // ─── 3. Schedule via Pilot logic ───
  let scheduledAt: Date
  let platforms: string[]
  try {
    const result = await pilotSchedulePost(postId)
    scheduledAt = result.scheduledAt
    platforms = result.platforms
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return rollback(`Scheduling failed: ${msg}`, 500)
  }

  // ─── 4. Publish to PE in scheduled mode ───
  // The publisher writes pe_post_id / pe_status / pe_scheduled_for itself.
  const publishResult = await publishToPostEverywhere(
    {
      id: post.id,
      content_type: post.content_type,
      status: 'approved',
      caption: post.caption,
      hashtags: post.hashtags,
      slide_image_urls: slideImageUrls,
      pe_status: post.pe_status ?? null
    },
    {
      platforms: platforms as Platform[],
      scheduledFor: scheduledAt.toISOString()
    }
  )

  if (!publishResult.ok) {
    // Don't rollback the slot — keeping pilot_scheduled_at lets us retry by
    // hand from the manual edit page. The post stays 'approved' (not draft).
    await supabase
      .from('ig_posts')
      .update({ pe_status: 'failed', pe_error: publishResult.error ?? 'unknown' })
      .eq('id', postId)
    return NextResponse.json(
      { error: `Publish to PE failed: ${publishResult.error}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    scheduledAt: scheduledAt.toISOString(),
    platforms,
    pe_post_id: publishResult.pe_post_id
  })
}
