import { getServerSupabase } from '@/lib/supabase/server'
import {
  getPostResults,
  type PeDestinationResult,
  type PePerPlatformStats
} from '@/lib/posteverywhere/client'

interface AggregatedStats {
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  platforms_data: Record<string, Record<string, unknown>>
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

// Destinations carry per-platform counters. The aggregator never trusts the
// shape blindly — every counter falls back to 0 if missing or non-numeric.
function aggregateFromDestinations(
  destinations: PeDestinationResult[],
  fallbackAggregate?: PePerPlatformStats
): AggregatedStats {
  let reach = 0
  let impressions = 0
  let likes = 0
  let comments = 0
  let shares = 0
  let saves = 0
  const platformsData: Record<string, Record<string, unknown>> = {}

  for (const dest of destinations) {
    const stats = (dest.stats ?? {}) as PePerPlatformStats
    reach += num(stats.reach)
    impressions += num(stats.impressions)
    likes += num(stats.likes)
    comments += num(stats.comments)
    shares += num(stats.shares)
    saves += num(stats.saves)

    platformsData[dest.platform] = {
      ...stats,
      status: dest.status,
      permalink: dest.permalink ?? null
    }
  }

  // If destinations had no usable stats but PE returned an aggregate at the
  // top level, prefer that (some providers only expose totals).
  const noDestinationStats =
    reach + impressions + likes + comments + shares + saves === 0
  if (noDestinationStats && fallbackAggregate) {
    reach = num(fallbackAggregate.reach)
    impressions = num(fallbackAggregate.impressions)
    likes = num(fallbackAggregate.likes)
    comments = num(fallbackAggregate.comments)
    shares = num(fallbackAggregate.shares)
    saves = num(fallbackAggregate.saves)
  }

  const totalEngagement = likes + comments + shares + saves
  const engagement_rate =
    reach > 0 ? Math.round((totalEngagement / reach) * 10000) / 100 : 0

  return {
    reach,
    impressions,
    likes,
    comments,
    shares,
    saves,
    engagement_rate,
    platforms_data: platformsData
  }
}

export interface CollectResult {
  ok: boolean
  error?: string
  reach?: number
  engagement_rate?: number
  hours_since_publish?: number
}

export async function collectStatsForPost(postId: string): Promise<CollectResult> {
  const supabase = getServerSupabase()

  const { data: post, error: fetchErr } = await supabase
    .from('ig_posts')
    .select('id, pe_post_id, pe_published_at, pilot_published_at, stats_fetch_count')
    .eq('id', postId)
    .single()

  if (fetchErr || !post) {
    return { ok: false, error: `Post not found: ${fetchErr?.message ?? postId}` }
  }
  if (!post.pe_post_id) {
    return { ok: false, error: 'Post has no pe_post_id' }
  }

  const publishedAt = post.pe_published_at || post.pilot_published_at
  if (!publishedAt) {
    return { ok: false, error: 'Post not yet published — no published_at timestamp' }
  }

  const hoursSincePublish =
    Math.round(((Date.now() - new Date(publishedAt).getTime()) / 3_600_000) * 10) / 10

  let peData
  try {
    peData = await getPostResults(post.pe_post_id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `PE getPostResults failed: ${msg}` }
  }

  const stats = aggregateFromDestinations(
    Array.isArray(peData?.destinations) ? peData.destinations : [],
    peData?.aggregated_stats
  )

  const { error: upsertError } = await supabase.from('ig_post_stats').upsert(
    {
      post_id: postId,
      pe_post_id: post.pe_post_id,
      hours_since_publish: hoursSincePublish,
      reach: stats.reach,
      impressions: stats.impressions,
      likes: stats.likes,
      comments: stats.comments,
      shares: stats.shares,
      saves: stats.saves,
      engagement_rate: stats.engagement_rate,
      platforms_data: stats.platforms_data,
      raw_pe_response: peData as unknown as object,
      fetched_at: new Date().toISOString()
    },
    { onConflict: 'post_id,hours_since_publish' }
  )

  if (upsertError) {
    return { ok: false, error: `Stats upsert failed: ${upsertError.message}` }
  }

  await supabase
    .from('ig_posts')
    .update({
      last_stats_fetched_at: new Date().toISOString(),
      stats_fetch_count: (post.stats_fetch_count ?? 0) + 1
    })
    .eq('id', postId)

  return {
    ok: true,
    reach: stats.reach,
    engagement_rate: stats.engagement_rate,
    hours_since_publish: hoursSincePublish
  }
}

export interface CollectBatchResult {
  checked: number
  updated: number
  errors: number
  errorSamples: { id: string; error: string }[]
}

// Picks up published posts that either:
//   - have never had their stats collected, OR
//   - had their last collection >12h ago
// Caps at 30 days post-publication (Instagram stops moving meaningfully).
// Hard-limited to 50 per run so the cron stays inside the function timeout.
export async function collectAllPendingStats(): Promise<CollectBatchResult> {
  const supabase = getServerSupabase()
  const twelveHoursAgo = new Date(Date.now() - 12 * 3_600_000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const { data: posts, error } = await supabase
    .from('ig_posts')
    .select('id, pe_published_at, pilot_published_at, last_stats_fetched_at')
    .eq('pe_status', 'published')
    .not('pe_post_id', 'is', null)
    .gte('pe_published_at', thirtyDaysAgo)
    .or(`last_stats_fetched_at.is.null,last_stats_fetched_at.lte.${twelveHoursAgo}`)
    .limit(50)

  if (error) {
    return {
      checked: 0,
      updated: 0,
      errors: 1,
      errorSamples: [{ id: 'fetch', error: error.message }]
    }
  }
  if (!posts || posts.length === 0) {
    return { checked: 0, updated: 0, errors: 0, errorSamples: [] }
  }

  let updated = 0
  let errors = 0
  const errorSamples: { id: string; error: string }[] = []

  for (const post of posts) {
    const result = await collectStatsForPost(post.id)
    if (result.ok) {
      updated++
    } else {
      errors++
      if (errorSamples.length < 5) {
        errorSamples.push({ id: post.id, error: result.error ?? 'unknown' })
      }
    }
  }

  return { checked: posts.length, updated, errors, errorSamples }
}
