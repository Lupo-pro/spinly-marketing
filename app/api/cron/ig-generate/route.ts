import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateDraft, selectAnglesForGeneration } from '@/lib/instagram/generator'
import { sendTelegramMessage, TG_EMOJIS } from '@/lib/telegram'

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()

  // Throttle: skip if too many drafts already waiting for validation.
  // Prevents accumulation when Lupo hasn't validated recent batches.
  const { count: draftCount } = await supabase
    .from('ig_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'draft')

  if (draftCount !== null && draftCount >= 8) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spinly-marketing.vercel.app'
    try {
      await sendTelegramMessage(
        `${TG_EMOJIS.warn} IG generator: ${draftCount} drafts en attente, génération du jour skippée. ` +
          `Valide d'abord sur ${appUrl}/admin/instagram`
      )
    } catch (err) {
      console.error('[ig-generate] Telegram skip notif failed:', err)
    }
    return NextResponse.json({ skipped: true, reason: 'too_many_drafts', count: draftCount })
  }

  const angles = await selectAnglesForGeneration(4)

  if (angles.length === 0) {
    try {
      await sendTelegramMessage(`${TG_EMOJIS.warn} IG generator: no angles available`)
    } catch (err) {
      console.error('[ig-generate] Telegram no-angles notif failed:', err)
    }
    return NextResponse.json({ generated: 0, reason: 'no_angles' })
  }

  type Result =
    | {
        ok: true
        carouselId: string
        singlePostId: string | null
        storyId: string | null
        hook: string
      }
    | { ok: false; angleId: string; error: string }

  const results: Result[] = []
  let totalSinglePosts = 0
  let totalStories = 0
  for (const angle of angles) {
    try {
      const draft = await generateDraft(angle)

      // 1. Insert the carousel (always present after validation passed).
      const { data: carouselPost, error: carouselErr } = await supabase
        .from('ig_posts')
        .insert({
          angle_id: angle.id,
          status: 'draft',
          content_type: 'carousel',
          slides_json: draft.carousel.slides,
          caption: draft.caption,
          hashtags: draft.hashtags
        })
        .select()
        .single()

      if (carouselErr) throw carouselErr

      // 2. Insert the single_post if Haiku produced a valid one.
      // The slide is wrapped { n: 1, ...singlePostSlide } so the renderer's
      // pageNum logic works the same way as for carousels.
      let singlePostId: string | null = null
      if (draft.single_post) {
        const singleSlide = { n: 1, ...draft.single_post }
        const { data: singlePost, error: singleErr } = await supabase
          .from('ig_posts')
          .insert({
            angle_id: angle.id,
            status: 'draft',
            content_type: 'single_post',
            slides_json: [singleSlide],
            caption: draft.caption,
            hashtags: draft.hashtags
          })
          .select()
          .single()

        if (singleErr) {
          console.warn(
            `[ig-generate] single_post insert failed for angle ${angle.id}: ${singleErr.message}`
          )
        } else {
          singlePostId = singlePost.id
          totalSinglePosts++
        }
      }

      // 3. Insert the story (Phase 11) if Haiku produced one.
      let storyId: string | null = null
      if (draft.story) {
        const storySlide = { n: 1, ...draft.story }
        const { data: storyPost, error: storyErr } = await supabase
          .from('ig_posts')
          .insert({
            angle_id: angle.id,
            status: 'draft',
            content_type: 'story',
            slides_json: [storySlide],
            caption: draft.caption,
            hashtags: draft.hashtags
          })
          .select()
          .single()

        if (storyErr) {
          console.warn(
            `[ig-generate] story insert failed for angle ${angle.id}: ${storyErr.message}`
          )
        } else {
          storyId = storyPost.id
          totalStories++
        }
      }

      await supabase
        .from('ig_angles')
        .update({
          used_count: (angle.used_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', angle.id)

      const firstSlide = draft.carousel.slides[0]
      const hookText = firstSlide.type === 'hook' ? firstSlide.title : ''
      results.push({
        ok: true,
        carouselId: carouselPost.id,
        singlePostId,
        storyId,
        hook: hookText
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ ok: false, angleId: angle.id, error: message })
    }
  }

  const successCount = results.filter((r) => r.ok).length
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spinly-marketing.vercel.app'

  try {
    await sendTelegramMessage(
      `${TG_EMOJIS.spin} IG generator: ${successCount}/${angles.length} carrousels + ${totalSinglePosts} posts simples + ${totalStories} stories générés.\n` +
        `Valide sur ${appUrl}/admin/instagram`
    )
  } catch (err) {
    console.error('[ig-generate] Telegram success notif failed:', err)
  }

  return NextResponse.json({
    generated: successCount,
    singlePosts: totalSinglePosts,
    stories: totalStories,
    total: angles.length,
    results
  })
}
