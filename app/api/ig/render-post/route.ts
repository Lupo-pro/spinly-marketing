import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { renderSlideToPng, closeBrowser } from '@/lib/instagram/renderer'
import { slideToTemplateUrl } from '@/lib/instagram/render-mapping'
import type { Slide } from '@/lib/instagram/generator'
import { sendTelegramMessage, TG_EMOJIS } from '@/lib/telegram'

export const maxDuration = 300

const RENDER_CONCURRENCY = 5

// N-worker semaphore: each worker pulls the next available index from a
// shared cursor and runs `fn`. Caps memory by limiting how many Chromium
// pages exist at once, while still parallelising across the 10 slides.
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (true) {
      const idx = next++
      if (idx >= items.length) break
      results[idx] = await fn(items[idx], idx)
    }
  }
  const workerCount = Math.min(limit, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

type SlideResult =
  | { ok: true; slideN: number; url: string }
  | { ok: false; slideN: number; error: string }

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const postId = body?.postId as string | undefined
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

  const slides = (post.slides_json ?? []) as Slide[]
  const contentType = (post.content_type ?? 'carousel') as 'carousel' | 'single_post' | 'story'

  const startedAt = Date.now()

  const results = await mapWithLimit<Slide, SlideResult>(
    slides,
    RENDER_CONCURRENCY,
    async (slide) => {
      try {
        const templateUrl = slideToTemplateUrl(slide, contentType)
        const png = await renderSlideToPng(templateUrl, contentType)

        const filename = `${postId}/slide-${String(slide.n).padStart(2, '0')}.png`
        const { error: uploadErr } = await supabase.storage
          .from('ig-content')
          .upload(filename, png, {
            contentType: 'image/png',
            upsert: true
          })

        if (uploadErr) throw uploadErr

        const { data: publicUrl } = supabase.storage.from('ig-content').getPublicUrl(filename)
        return { ok: true, slideN: slide.n, url: publicUrl.publicUrl }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(
          `[render-error] postId=${postId} slideIndex=${slide.n} template=${slide.type} error=${message}`
        )
        return { ok: false, slideN: slide.n, error: message }
      }
    }
  )

  const urls: string[] = []
  const errors: { slideN: number; error: string }[] = []
  for (const r of results) {
    if (r.ok) urls.push(r.url)
    else errors.push({ slideN: r.slideN, error: r.error })
  }

  const elapsedMs = Date.now() - startedAt

  await supabase.from('ig_posts').update({ slide_image_urls: urls }).eq('id', postId)

  try {
    await sendTelegramMessage(
      `${TG_EMOJIS.camera} IG renderer: ${urls.length}/${slides.length} slides rendues pour post ${postId.slice(0, 8)} (${(elapsedMs / 1000).toFixed(1)}s)` +
        (errors.length ? `\nErreurs: ${errors.length}` : '')
    )
  } catch {}

  try {
    await closeBrowser()
  } catch {}

  return NextResponse.json({
    rendered: urls.length,
    total: slides.length,
    elapsedMs,
    urls,
    errors
  })
}
