import { getServerSupabase } from '@/lib/supabase/server'
import { createPost, uploadMedia, type CreatePostParams, type PlatformContentMap } from './client'

const ACCOUNT_IDS: Record<string, number | null> = {
  instagram: process.env.POSTEVERYWHERE_ACCOUNT_IG
    ? parseInt(process.env.POSTEVERYWHERE_ACCOUNT_IG, 10)
    : null,
  facebook: process.env.POSTEVERYWHERE_ACCOUNT_FB
    ? parseInt(process.env.POSTEVERYWHERE_ACCOUNT_FB, 10)
    : null,
  threads: process.env.POSTEVERYWHERE_ACCOUNT_THREADS
    ? parseInt(process.env.POSTEVERYWHERE_ACCOUNT_THREADS, 10)
    : null,
  tiktok: process.env.POSTEVERYWHERE_ACCOUNT_TIKTOK
    ? parseInt(process.env.POSTEVERYWHERE_ACCOUNT_TIKTOK, 10)
    : null,
  linkedin: process.env.POSTEVERYWHERE_ACCOUNT_LINKEDIN
    ? parseInt(process.env.POSTEVERYWHERE_ACCOUNT_LINKEDIN, 10)
    : null,
  x: process.env.POSTEVERYWHERE_ACCOUNT_X ? parseInt(process.env.POSTEVERYWHERE_ACCOUNT_X, 10) : null
}

export type Platform = keyof typeof ACCOUNT_IDS

export interface PublishOptions {
  /** Target platforms. If empty, defaults are picked by content_type. */
  platforms?: Platform[]
  /** UTC ISO 8601 with Z suffix; if omitted, post immediately. */
  scheduledFor?: string
}

// Minimal shape of an ig_posts row that the publisher needs to consume.
// We don't import a full DB type — just declare the fields we touch.
export interface PublishablePost {
  id: string
  content_type: string
  status: string
  caption: string
  hashtags: string[] | null
  slide_image_urls: string[] | null
  pe_status?: string | null
}

function resolveAccountIds(platforms: Platform[]): number[] {
  const ids: number[] = []
  for (const p of platforms) {
    const id = ACCOUNT_IDS[p]
    if (id) ids.push(id)
  }
  return ids
}

function defaultPlatforms(contentType: string): Platform[] {
  if (contentType === 'story') return ['instagram']
  // Carousel / single_post: IG + FB + Threads (only those connected).
  return (['instagram', 'facebook', 'threads'] as Platform[]).filter((p) => ACCOUNT_IDS[p])
}

async function uploadSlides(slideImageUrls: string[]): Promise<string[]> {
  const mediaIds: string[] = []
  for (let i = 0; i < slideImageUrls.length; i++) {
    const url = slideImageUrls[i]
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch slide ${i + 1} from storage (HTTP ${res.status})`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const filename = `slide-${String(i + 1).padStart(2, '0')}.png`
    const result = await uploadMedia(buffer, filename, 'image/png')
    mediaIds.push(result.media_id)
  }
  return mediaIds
}

// PE has no firstComment field, so hashtags go inline at the end of the
// caption with a 2-blank-line separator (Instagram convention).
function buildCaptionWithTags(post: PublishablePost): string {
  const tags = (post.hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`))
  if (tags.length === 0) return post.caption
  return `${post.caption}\n\n${tags.join(' ')}`
}

function buildPlatformContent(
  post: PublishablePost,
  fullCaption: string
): PlatformContentMap | undefined {
  if (post.content_type === 'story') {
    // Stories don't show hashtags or long captions on IG. Use the post caption
    // unchanged on the story overlay (most won't see it; PE ignores when N/A).
    return { instagram: { contentType: 'Story', content: post.caption } }
  }
  // Carousel / single_post: send full caption (with hashtags) to all platforms.
  // (We send `content` per-platform only when we want to override the global.)
  return {
    instagram: { contentType: 'Post' },
    facebook: { content: fullCaption }
  }
}

export async function publishToPostEverywhere(
  post: PublishablePost,
  options: PublishOptions = {}
): Promise<{
  ok: boolean
  pe_post_id?: string
  destinations?: unknown[]
  error?: string
}> {
  const supabase = getServerSupabase()

  try {
    if (!post.slide_image_urls || post.slide_image_urls.length === 0) {
      return { ok: false, error: 'No rendered slides found. Render before publishing.' }
    }

    const platforms = options.platforms?.length
      ? options.platforms
      : defaultPlatforms(post.content_type)
    const accountIds = resolveAccountIds(platforms)
    if (accountIds.length === 0) {
      return { ok: false, error: 'No connected accounts found for selected platforms.' }
    }

    console.log(
      `[publisher] Uploading ${post.slide_image_urls.length} slide(s) to PostEverywhere…`
    )
    const mediaIds = await uploadSlides(post.slide_image_urls)
    console.log(`[publisher] Got ${mediaIds.length} media_ids`)

    const fullCaption = buildCaptionWithTags(post)

    const params: CreatePostParams = {
      content: fullCaption,
      account_ids: accountIds,
      media_ids: mediaIds,
      timezone: 'America/Bogota',
      platform_content: buildPlatformContent(post, fullCaption)
    }
    if (options.scheduledFor) {
      params.scheduled_for = options.scheduledFor
    }

    console.log(`[publisher] Creating PE post on platforms: ${platforms.join(', ')}`)
    const created = await createPost(params)

    await supabase
      .from('ig_posts')
      .update({
        pe_post_id: created.post_id,
        pe_status: created.status === 'scheduled' ? 'scheduled' : 'queued',
        pe_scheduled_for: created.scheduled_for ?? null,
        pe_destinations: created.destinations,
        pe_error: null,
        pe_last_check_at: new Date().toISOString()
      })
      .eq('id', post.id)

    return {
      ok: true,
      pe_post_id: created.post_id,
      destinations: created.destinations
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[publisher] Publish failed:', errorMsg)
    await supabase
      .from('ig_posts')
      .update({ pe_status: 'failed', pe_error: errorMsg })
      .eq('id', post.id)
    return { ok: false, error: errorMsg }
  }
}
