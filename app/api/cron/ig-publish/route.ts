import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { publishCarousel } from '@/lib/instagram/publisher'
import { sendTelegramMessage, TG_EMOJIS } from '@/lib/telegram'

export const maxDuration = 300

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const now = new Date()

  const { data: posts, error } = await supabase
    .from('ig_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now.toISOString())
    .lt('publish_attempts', 3)
    .order('scheduled_for', { ascending: true })
    .limit(5)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ published: 0, reason: 'no_posts_due' })
  }

  type Result =
    | { ok: true; postId: string; igMediaId?: string }
    | { ok: false; postId: string; error: string }

  const results: Result[] = []
  for (const post of posts) {
    try {
      await supabase
        .from('ig_posts')
        .update({
          publish_attempts: (post.publish_attempts || 0) + 1,
          last_publish_attempt_at: new Date().toISOString()
        })
        .eq('id', post.id)

      const result = await publishCarousel(post.id)

      if (result.ok) {
        results.push({ ok: true, postId: post.id, igMediaId: result.ig_media_id })
        try {
          await sendTelegramMessage(
            `${TG_EMOJIS.camera} IG publié !\n` +
              `Post : ${post.id.slice(0, 8)}\n` +
              `Permalink : ${result.ig_permalink || '(non disponible)'}`
          )
        } catch {}
      } else {
        await supabase
          .from('ig_posts')
          .update({ last_publish_error: result.error })
          .eq('id', post.id)

        results.push({ ok: false, postId: post.id, error: result.error || 'unknown' })

        try {
          await sendTelegramMessage(
            `${TG_EMOJIS.cross} IG publish FAILED\n` +
              `Post : ${post.id.slice(0, 8)}\n` +
              `Error : ${result.error}\n` +
              `Tentatives : ${(post.publish_attempts || 0) + 1}/3`
          )
        } catch {}

        if ((post.publish_attempts || 0) + 1 >= 3) {
          await supabase
            .from('ig_posts')
            .update({ status: 'failed' })
            .eq('id', post.id)

          await supabase
            .from('ig_account')
            .update({
              // best-effort counter; we don't refetch the row to keep this fast
              posts_failed_count: 1
            })
            .eq('active', true)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ ok: false, postId: post.id, error: message })
    }
  }

  const successCount = results.filter((r) => r.ok).length

  return NextResponse.json({
    processed: posts.length,
    published: successCount,
    failed: posts.length - successCount,
    results
  })
}
