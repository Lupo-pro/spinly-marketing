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
  searchParams: { filter?: string }
}) {
  const supabase = getServerSupabase()
  const filter = searchParams.filter
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

  const { data: posts } = await query

  // 4 stats counts in parallel — use head:true so we don't pull rows.
  const [draftsRes, approvedRes, scheduledRes, publishedRes] = await Promise.all([
    supabase.from('ig_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('ig_posts').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase
      .from('ig_posts')
      .select('id', { count: 'exact', head: true })
      .eq('pe_status', 'scheduled'),
    supabase.from('ig_posts').select('id', { count: 'exact', head: true }).eq('pe_status', 'published')
  ])

  const currentFilter = isFilteredType ? (filter as string) : 'all'
  const typedPosts = (posts ?? []) as unknown as PostCardData[]

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
            style={{
              fontSize: 12,
              color: SPINLY_BRAND.text.secondary,
              textDecoration: 'none'
            }}
          >
            ← Admin
          </Link>
        </div>

        <ContentStudioHeader />

        <StatsBar
          drafts={draftsRes.count ?? 0}
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
            Compte & monitoring →
          </Link>
        </div>

        <PostsGrid posts={typedPosts} />
      </div>
    </main>
  )
}
