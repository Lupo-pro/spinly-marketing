import { getServerSupabase } from '@/lib/supabase/server'

const META_API_VERSION = 'v21.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

interface PublishResult {
  ok: boolean
  ig_media_id?: string
  ig_permalink?: string
  error?: string
  errorCode?: number
  rawResponse?: unknown
}

export async function getAccount() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('ig_account')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error('No active IG account configured')
  }
  return data
}

// Publishes an IG carousel via Meta Graph API.
// 1. For each slide URL, create a media container with is_carousel_item=true.
// 2. Create a parent CAROUSEL container with the children IDs.
// 3. media_publish the parent.
// Meta sometimes needs a few seconds before a carousel is "ready", hence the
// 3-attempt retry on the final publish.
export async function publishCarousel(postId: string): Promise<PublishResult> {
  const supabase = getServerSupabase()

  const { data: post } = await supabase
    .from('ig_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (!post) {
    return { ok: false, error: 'Post not found' }
  }

  if (!post.slide_image_urls || post.slide_image_urls.length !== 10) {
    return {
      ok: false,
      error: `Expected 10 slides rendered, got ${post.slide_image_urls?.length || 0}`
    }
  }

  let account
  try {
    account = await getAccount()
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  if (!account.access_token || !account.ig_user_id) {
    return { ok: false, error: 'Account missing access_token or ig_user_id' }
  }

  if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
    return { ok: false, error: 'Access token expired, run refresh-token cron' }
  }

  const igUserId = account.ig_user_id
  const accessToken = account.access_token

  // Step 1: create the 10 media containers
  const childrenIds: string[] = []

  for (const url of post.slide_image_urls as string[]) {
    try {
      const res = await fetch(`${META_BASE}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: accessToken
        })
      })

      const body = await res.json()

      if (!res.ok || !body.id) {
        await logPublishAttempt(
          postId,
          false,
          null,
          body.error?.message || 'Container creation failed',
          res.status,
          body
        )
        return {
          ok: false,
          error: `Container failed for ${url}: ${body.error?.message || 'unknown'}`,
          errorCode: res.status,
          rawResponse: body
        }
      }

      childrenIds.push(body.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await logPublishAttempt(postId, false, null, `Network error on container: ${message}`, 0, null)
      return { ok: false, error: `Network error on container: ${message}` }
    }
  }

  // Step 2: create the parent CAROUSEL container
  const captionFull =
    post.caption +
    (post.hashtags && post.hashtags.length > 0 ? '\n\n' + post.hashtags.join(' ') : '')

  let parentId: string
  try {
    const res = await fetch(`${META_BASE}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childrenIds.join(','),
        caption: captionFull,
        access_token: accessToken
      })
    })

    const body = await res.json()

    if (!res.ok || !body.id) {
      await logPublishAttempt(
        postId,
        false,
        null,
        body.error?.message || 'Parent container failed',
        res.status,
        body
      )
      return {
        ok: false,
        error: `Parent container failed: ${body.error?.message || 'unknown'}`,
        errorCode: res.status,
        rawResponse: body
      }
    }

    parentId = body.id
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logPublishAttempt(postId, false, null, `Network error on parent: ${message}`, 0, null)
    return { ok: false, error: `Network error on parent: ${message}` }
  }

  // Step 3: publish the parent (with retry on "media not ready")
  let publishedId: string | null = null
  let lastError: unknown = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${META_BASE}/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: parentId,
          access_token: accessToken
        })
      })

      const body = await res.json()

      if (res.ok && body.id) {
        publishedId = body.id
        break
      }

      lastError = body
      if (body.error?.code === 9007 || body.error?.message?.includes('not ready')) {
        await new Promise((r) => setTimeout(r, 5000))
        continue
      }

      await logPublishAttempt(
        postId,
        false,
        null,
        body.error?.message || 'Publish failed',
        res.status,
        body
      )
      return {
        ok: false,
        error: `Publish failed: ${body.error?.message || 'unknown'}`,
        errorCode: res.status,
        rawResponse: body
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      lastError = { error: { message } }
      if (attempt === 3) {
        await logPublishAttempt(postId, false, null, `Network error on publish: ${message}`, 0, null)
        return { ok: false, error: `Network error on publish: ${message}` }
      }
      await new Promise((r) => setTimeout(r, 5000))
    }
  }

  if (!publishedId) {
    await logPublishAttempt(postId, false, null, 'Publish exhausted retries', 0, lastError)
    return { ok: false, error: 'Publish exhausted retries', rawResponse: lastError }
  }

  // Step 4: best-effort permalink fetch
  let permalink: string | undefined
  try {
    const res = await fetch(
      `${META_BASE}/${publishedId}?fields=permalink&access_token=${accessToken}`
    )
    const body = await res.json()
    permalink = body.permalink
  } catch {}

  // Step 5: update post + log
  await supabase
    .from('ig_posts')
    .update({
      status: 'published',
      ig_media_id: publishedId,
      ig_permalink: permalink,
      published_at: new Date().toISOString()
    })
    .eq('id', postId)

  await supabase
    .from('ig_account')
    .update({
      posts_published_count: (account.posts_published_count || 0) + 1
    })
    .eq('id', account.id)

  await logPublishAttempt(postId, true, publishedId, null, 200, null)

  return { ok: true, ig_media_id: publishedId, ig_permalink: permalink }
}

async function logPublishAttempt(
  postId: string,
  success: boolean,
  igMediaId: string | null,
  errorMessage: string | null,
  responseCode: number,
  responseBody: unknown
) {
  const supabase = getServerSupabase()
  await supabase.from('ig_publish_logs').insert({
    post_id: postId,
    success,
    ig_media_id: igMediaId,
    error_message: errorMessage,
    meta_response_code: responseCode,
    meta_response_body: responseBody
  })
}

// Long-lived Meta token refresh (60-day rolling). Run via cron every 50 days.
export async function refreshAccessToken(): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServerSupabase()
  const account = await getAccount()

  if (!account.app_id || !account.access_token) {
    return { ok: false, error: 'app_id or access_token missing' }
  }

  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) {
    return { ok: false, error: 'META_APP_SECRET env var missing' }
  }

  try {
    const url = new URL(`${META_BASE}/oauth/access_token`)
    url.searchParams.set('grant_type', 'fb_exchange_token')
    url.searchParams.set('client_id', account.app_id)
    url.searchParams.set('client_secret', appSecret)
    url.searchParams.set('fb_exchange_token', account.access_token)

    const res = await fetch(url.toString())
    const body = await res.json()

    if (!res.ok || !body.access_token) {
      return { ok: false, error: body.error?.message || 'Refresh failed' }
    }

    const newExpiresAt = new Date(Date.now() + body.expires_in * 1000)

    await supabase
      .from('ig_account')
      .update({
        access_token: body.access_token,
        token_expires_at: newExpiresAt.toISOString(),
        last_token_refresh_at: new Date().toISOString()
      })
      .eq('id', account.id)

    await supabase.from('ig_token_history').insert({
      account_id: account.id,
      expires_at: newExpiresAt.toISOString(),
      refresh_method: 'cron'
    })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
