import Link from 'next/link'
import { getServerSupabase } from '@/lib/supabase/server'
import ContentStudioHeader from './_components/ContentStudioHeader'
import StatsBar from './_components/StatsBar'
import ContentTypeFilter from './_components/ContentTypeFilter'
import PostsGrid from './_components/PostsGrid'
import { SPINLY_BRAND } from './_styles/brand'
import type { PostCardData } from './_components/PostCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const VALID_FILTERS = ['carousel', 'single_post', 'story'] as const

export default async function InstagramAdminPage({
  searchParams
}: {
  searchParams: { filter?: string; show_rejected?: string }
}) {
  const supabase = getServerSupabase()
  const filter = searchParams.filter
  const showRejected = searchParams.show_rejected === '1'
  const isFilteredType = (VALID_FILTERS as readonly string[]).includes(filter ?? '')

  let query = supabase
    .from('ig_posts')
    .select(
      'id, status, content_type, slides_json, generated_at, slide_image_urls, published_at, ig_permalink, pe_status, pe_scheduled_for, caption, ig_angles(axis)'
    )
    .order('generated_at', { ascending: false })
    .limit(60)

  if (isFilteredType) {
    query = query.eq('content_type', filter as string)
  }
  // Hide rejected by default — they pollute the swipe inbox.
  if (!showRejected) {
    query = query.neq('status', 'rejected')
  }

  const { data: posts } = await query

  const [draftsRes, approvedRes, scheduledRes, publishedRes, rejectedRes] = await Promise.all([
    supabase.from('ig_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('ig_posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase
      .from('ig_posts')
      .select('id', { count: 'exact', head: true })
      .eq('pe_status', 'scheduled'),
    supabase
      .from('ig_posts')
      .select('id', { count: 'exact', head: true })
      .eq('pe_status', 'published'),
    supabase.from('ig_posts').select('id', { count: 'exact', head: true }).eq('status', 'rejected')
  ])

  const currentFilter = isFilteredType ? (filter as string) : 'all'
  const typedPosts = (posts ?? []) as unknown as PostCardData[]
  const draftsCount = draftsRes.count ?? 0
  const rejectedCount = rejectedRes.count ?? 0

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
            href="/admin"
            style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, textDecoration: 'none' }}
          >
            ← Admin
          </Link>
        </div>

        <ContentStudioHeader />

        {/* Pilot CTAs — primary entry points for the day */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
            marginBottom: 20
          }}
        >
          <Link
            href="/admin/instagram/pilot"
            style={{
              background:
                draftsCount > 0
                  ? SPINLY_BRAND.gradientWarm
                  : 'rgba(245, 158, 44, 0.06)',
              color: SPINLY_BRAND.text.primary,
              textDecoration: 'none',
              padding: '18px 20px',
              borderRadius: 14,
              border:
                draftsCount > 0 ? 'none' : `1px solid ${SPINLY_BRAND.border.accent}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, opacity: 0.85 }}>
              {draftsCount > 0 ? 'À VALIDER' : 'INBOX VIDE'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)' }}>
              🚀 Mode Pilot {draftsCount > 0 ? `(${draftsCount})` : '✓'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Swipe ← / → pour rejeter / approuver
            </div>
          </Link>

          <Link
            href="/admin/instagram/calendar"
            style={{
              background: SPINLY_BRAND.bg.surface,
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              color: SPINLY_BRAND.text.primary,
              textDecoration: 'none',
              padding: '18px 20px',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: SPINLY_BRAND.text.secondary
              }}
            >
              7 PROCHAINS JOURS
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)' }}>
              📅 Calendrier
            </div>
            <div style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary }}>
              Vue agenda des posts programmés
            </div>
          </Link>
        </div>

        <StatsBar
          drafts={draftsCount}
          approved={approvedRes.count ?? 0}
          scheduled={scheduledRes.count ?? 0}
          published={publishedRes.count ?? 0}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <ContentTypeFilter currentFilter={currentFilter} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link
              href="/admin/instagram/stats"
              style={{
                fontSize: 13,
                color: '#60A5FA',
                textDecoration: 'none',
                padding: '8px 12px',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                background: 'rgba(96, 165, 250, 0.08)',
                borderRadius: 10,
                fontWeight: 500
              }}
            >
              📊 Stats &amp; Performance
            </Link>
            <Link
              href="/admin/instagram/account"
              style={{
                fontSize: 13,
                color: SPINLY_BRAND.text.secondary,
                textDecoration: 'none',
                padding: '8px 12px',
                border: `1px solid ${SPINLY_BRAND.border.default}`,
                borderRadius: 10
              }}
            >
              Compte &amp; monitoring →
            </Link>
          </div>
        </div>

        <PostsGrid posts={typedPosts} />

        {rejectedCount > 0 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href={
                showRejected
                  ? `/admin/instagram${currentFilter !== 'all' ? `?filter=${currentFilter}` : ''}`
                  : `/admin/instagram?show_rejected=1${currentFilter !== 'all' ? `&filter=${currentFilter}` : ''}`
              }
              style={{
                fontSize: 12,
                color: SPINLY_BRAND.text.tertiary,
                textDecoration: 'underline'
              }}
            >
              {showRejected
                ? `Cacher les rejetés (${rejectedCount})`
                : `Voir aussi les rejetés (${rejectedCount})`}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
