import Link from 'next/link'
import { getServerSupabase } from '@/lib/supabase/server'
import GlobalStatsBar from '../_components/GlobalStatsBar'
import TopPostsView, { type TopPostStat } from '../_components/TopPostsView'
import RefreshStatsButton from '../_components/RefreshStatsButton'
import { SPINLY_BRAND } from '../_styles/brand'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const POST_FIELDS = `id, content_type, caption, slide_image_urls, pe_published_at, pilot_published_at`

interface RawTopRow {
  post_id: string
  reach: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  engagement_rate: number | null
  hours_since_publish: number | null
  post:
    | {
        id: string
        content_type: 'carousel' | 'single_post' | 'story' | null
        caption: string | null
        slide_image_urls: string[] | null
        pe_published_at: string | null
        pilot_published_at: string | null
      }
    | null
}

function normalizeTopRows(rows: RawTopRow[] | null | undefined): TopPostStat[] {
  return (rows ?? [])
    .filter((r) => !!r.post)
    .map((r) => ({
      post_id: r.post_id,
      reach: r.reach ?? 0,
      likes: r.likes ?? 0,
      comments: r.comments ?? 0,
      shares: r.shares ?? 0,
      saves: r.saves ?? 0,
      engagement_rate: r.engagement_rate ?? 0,
      hours_since_publish: r.hours_since_publish,
      post: r.post
    }))
}

export default async function StatsPage() {
  const supabase = getServerSupabase()

  const [{ data: byEngagement }, { data: byReach }, { data: globalRows }] = await Promise.all([
    supabase
      .from('ig_post_latest_stats')
      .select(`*, post:ig_posts (${POST_FIELDS})`)
      .gt('reach', 10)
      .order('engagement_rate', { ascending: false })
      .limit(10),
    supabase
      .from('ig_post_latest_stats')
      .select(`*, post:ig_posts (${POST_FIELDS})`)
      .order('reach', { ascending: false })
      .limit(10),
    supabase
      .from('ig_post_latest_stats')
      .select('reach, likes, comments, shares, saves')
  ])

  const topByEngagement = normalizeTopRows(byEngagement as unknown as RawTopRow[])
  const topByReach = normalizeTopRows(byReach as unknown as RawTopRow[])

  type Totals = {
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    count: number
  }
  const initial: Totals = { reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, count: 0 }
  const totals: Totals = (globalRows ?? []).reduce<Totals>(
    (acc, s) => ({
      reach: acc.reach + (s.reach ?? 0),
      likes: acc.likes + (s.likes ?? 0),
      comments: acc.comments + (s.comments ?? 0),
      shares: acc.shares + (s.shares ?? 0),
      saves: acc.saves + (s.saves ?? 0),
      count: acc.count + 1
    }),
    initial
  )

  const totalEngagement = totals.likes + totals.comments + totals.shares + totals.saves
  const avgEngagement =
    totals.reach > 0
      ? Math.round((totalEngagement / totals.reach) * 10000) / 100
      : 0

  return (
    <main
      style={{
        background: SPINLY_BRAND.bg.base,
        minHeight: '100vh',
        padding: 24,
        fontFamily: 'var(--font-body), system-ui, -apple-system, sans-serif',
        color: SPINLY_BRAND.text.primary
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}>
          <Link
            href="/admin/instagram"
            style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, textDecoration: 'none' }}
          >
            ← Content Studio
          </Link>
        </div>

        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2,
              color: SPINLY_BRAND.text.secondary,
              textTransform: 'uppercase',
              marginBottom: 4
            }}
          >
            Performance · PostEverywhere
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: -0.5,
              margin: 0
            }}
          >
            Stats &amp; Performance
          </h1>
          <p
            style={{
              fontSize: 13,
              color: SPINLY_BRAND.text.secondary,
              marginTop: 6,
              marginBottom: 0
            }}
          >
            Collecte automatique 1×/jour à 9h Bogotá · données accumulées pour
            préparer l&apos;apprentissage actif (Phase 19).
          </p>
        </header>

        <GlobalStatsBar totals={totals} avgEngagement={avgEngagement} />

        <RefreshStatsButton />

        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: '32px 0 16px',
            fontFamily: 'var(--font-display)'
          }}
        >
          🏆 Top engagement
        </h2>
        <TopPostsView posts={topByEngagement} metric="engagement_rate" />

        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: '32px 0 16px',
            fontFamily: 'var(--font-display)'
          }}
        >
          📈 Top reach
        </h2>
        <TopPostsView posts={topByReach} metric="reach" />
      </div>
    </main>
  )
}
