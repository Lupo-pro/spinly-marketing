import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { pilotSchedulePost } from '@/lib/pilot/scheduler'
import { publishToPostEverywhere, type Platform } from '@/lib/posteverywhere/publisher'
import { sendTelegramMessage, TG_EMOJIS } from '@/lib/telegram'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Internal worker invoked fire-and-forget by /api/ig/approve-pilot AND by the
// watchdog in /api/cron/pe-status-poll. Bearer-secret-protected so it can't
// be triggered from the open web. Steps:
//   1. (idempotent) render slides if missing
//   2. reserve a Pilot slot
//   3. publish to PostEverywhere in scheduled mode
// Always clears pilot_processing on the way out (success OR failure), and
// records pilot_error on failure so the dashboard can surface it.
export async function POST(req: Request) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.INTERNAL_PROCESS_SECRET || process.env.CRON_SECRET || ''}`
  // Compare with timingSafeEqual-ish: bail early if either is empty so we
  // don't accept a misconfigured environment as authenticated.
  if (!process.env.INTERNAL_PROCESS_SECRET && !process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Internal secret not configured' }, { status: 500 })
  }
  if (auth !== expected) {
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

  const startTs = Date.now()
  const contentType = (post.content_type ?? 'carousel') as 'carousel' | 'single_post' | 'story'
  const expectedSlides = contentType === 'carousel' ? 10 : 1

  async function clearProcessing(errorMsg: string | null) {
    await supabase
      .from('ig_posts')
      .update({
        pilot_processing: false,
        pilot_error: errorMsg
      })
      .eq('id', postId!)
  }

  try {
    // ─── 1. Render (idempotent — skip if already rendered) ───
    let slideImageUrls: string[] = Array.isArray(post.slide_image_urls)
      ? post.slide_image_urls
      : []

    if (slideImageUrls.length !== expectedSlides) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      const cronSecret = process.env.CRON_SECRET
      if (!cronSecret) throw new Error('CRON_SECRET not configured')

      console.log(`[process-approved] ${postId} rendering ${expectedSlides} slides…`)
      const renderRes = await fetch(`${baseUrl}/api/ig/render-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cronSecret}`
        },
        body: JSON.stringify({ postId }),
        cache: 'no-store'
      })
      const renderData = await renderRes.json().catch(() => ({}))
      if (!renderRes.ok) {
        throw new Error(`Render failed: ${renderData?.error ?? `HTTP ${renderRes.status}`}`)
      }
      if (!Array.isArray(renderData.urls) || renderData.urls.length !== expectedSlides) {
        throw new Error(
          `Render incomplete: ${renderData.urls?.length ?? 0}/${expectedSlides} slides`
        )
      }
      slideImageUrls = renderData.urls as string[]
    }

    // ─── 2. Reserve slot via Pilot ───
    // pilotSchedulePost is idempotent IF pilot_scheduled_at is already set —
    // it would re-pick a new slot. To be safe, only schedule if we don't
    // already have one (covers the watchdog re-run case).
    let scheduledAt: Date
    let platforms: string[]
    if (post.pilot_scheduled_at && Array.isArray(post.pilot_platforms)) {
      scheduledAt = new Date(post.pilot_scheduled_at)
      platforms = post.pilot_platforms as string[]
      console.log(`[process-approved] ${postId} reusing existing slot ${scheduledAt.toISOString()}`)
    } else {
      console.log(`[process-approved] ${postId} reserving slot…`)
      const result = await pilotSchedulePost(postId)
      scheduledAt = result.scheduledAt
      platforms = result.platforms
    }

    // ─── 3. Publish (skip if already sent to PE — covers watchdog retry) ───
    if (post.pe_post_id) {
      console.log(
        `[process-approved] ${postId} already has pe_post_id=${post.pe_post_id}, skipping publish`
      )
    } else {
      console.log(`[process-approved] ${postId} publishing on ${platforms.join(',')}…`)
      const result = await publishToPostEverywhere(
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
      if (!result.ok) {
        throw new Error(`Publish to PE failed: ${result.error}`)
      }
    }

    await clearProcessing(null)

    const elapsedSec = Math.round((Date.now() - startTs) / 1000)
    console.log(`[process-approved] ${postId} OK in ${elapsedSec}s`)

    // Fire Telegram confirmation. Best-effort.
    try {
      const dateStr = scheduledAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
      })
      const hookSnippet = (post.caption ?? '').split('\n')[0].slice(0, 70)
      await sendTelegramMessage(
        `${TG_EMOJIS.check} Post programmé : « ${hookSnippet} »\n` +
          `📅 ${dateStr} (Bogotá)\n→ ${platforms.join(' · ')}`
      )
    } catch (err) {
      console.error('[process-approved] Telegram success notif failed:', err)
    }

    return NextResponse.json({
      ok: true,
      postId,
      scheduledAt: scheduledAt.toISOString(),
      platforms,
      elapsedSec
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[process-approved] ${postId} FAILED in ${Math.round((Date.now() - startTs) / 1000)}s:`, errorMsg)

    await clearProcessing(errorMsg)

    try {
      const hookSnippet = (post.caption ?? '').split('\n')[0].slice(0, 70)
      await sendTelegramMessage(
        `${TG_EMOJIS.cross} Échec process post\n« ${hookSnippet} »\nErreur : ${errorMsg}`
      )
    } catch (e) {
      console.error('[process-approved] Telegram failure notif failed:', e)
    }

    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 })
  }
}
