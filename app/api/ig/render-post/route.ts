import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { renderSlideToPng, closeBrowser } from '@/lib/instagram/renderer'
import { slideToTemplateUrl } from '@/lib/instagram/render-mapping'
import type { Slide } from '@/lib/instagram/generator'
import { sendTelegramMessage, TG_EMOJIS } from '@/lib/telegram'

export const maxDuration = 300

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
  const urls: string[] = []
  const errors: { slideN: number; error: string }[] = []

  for (const slide of slides) {
    try {
      const templateUrl = slideToTemplateUrl(slide)
      const png = await renderSlideToPng(templateUrl)

      const filename = `${postId}/slide-${String(slide.n).padStart(2, '0')}.png`
      const { error: uploadErr } = await supabase.storage
        .from('ig-content')
        .upload(filename, png, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadErr) throw uploadErr

      const { data: publicUrl } = supabase.storage.from('ig-content').getPublicUrl(filename)
      urls.push(publicUrl.publicUrl)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(
        `[render-error] postId=${postId} slideIndex=${slide.n} template=${slide.type} error=${message}`
      )
      errors.push({ slideN: slide.n, error: message })
    }
  }

  await supabase.from('ig_posts').update({ slide_image_urls: urls }).eq('id', postId)

  try {
    await sendTelegramMessage(
      `${TG_EMOJIS.camera} IG renderer: ${urls.length}/${slides.length} slides rendues pour post ${postId.slice(0, 8)}` +
        (errors.length ? `\nErreurs: ${errors.length}` : '')
    )
  } catch {}

  try {
    await closeBrowser()
  } catch {}

  return NextResponse.json({
    rendered: urls.length,
    total: slides.length,
    urls,
    errors
  })
}
