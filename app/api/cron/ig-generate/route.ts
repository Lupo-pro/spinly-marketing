import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { generateCarousel, selectAnglesForGeneration } from '@/lib/instagram/generator'
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
    } catch {}
    return NextResponse.json({ skipped: true, reason: 'too_many_drafts', count: draftCount })
  }

  const angles = await selectAnglesForGeneration(4)

  if (angles.length === 0) {
    try {
      await sendTelegramMessage(`${TG_EMOJIS.warn} IG generator: no angles available`)
    } catch {}
    return NextResponse.json({ generated: 0, reason: 'no_angles' })
  }

  type Result =
    | { ok: true; postId: string; hook: string }
    | { ok: false; angleId: string; error: string }

  const results: Result[] = []
  for (const angle of angles) {
    try {
      const carousel = await generateCarousel(angle)

      const { data: post, error } = await supabase
        .from('ig_posts')
        .insert({
          angle_id: angle.id,
          status: 'draft',
          slides_json: carousel.slides,
          caption: carousel.caption,
          hashtags: carousel.hashtags
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('ig_angles')
        .update({
          used_count: (angle.used_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', angle.id)

      const firstSlide = carousel.slides[0]
      const hookText = firstSlide.type === 'hook' ? firstSlide.title : ''
      results.push({ ok: true, postId: post.id, hook: hookText })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ ok: false, angleId: angle.id, error: message })
    }
  }

  const successCount = results.filter((r) => r.ok).length
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spinly-marketing.vercel.app'

  try {
    await sendTelegramMessage(
      `${TG_EMOJIS.spin} IG generator: ${successCount}/${angles.length} carrousels générés.\n` +
        `Valide sur ${appUrl}/admin/instagram`
    )
  } catch {}

  return NextResponse.json({ generated: successCount, total: angles.length, results })
}
