import Link from 'next/link'
import { getServerSupabase } from '@/lib/supabase/server'
import PilotValidator, { type PilotPost } from '../_components/PilotValidator'
import { SPINLY_BRAND } from '../_styles/brand'

export const dynamic = 'force-dynamic'

export default async function PilotPage() {
  const supabase = getServerSupabase()
  const { data: posts } = await supabase
    .from('ig_posts')
    .select(
      'id, status, content_type, slides_json, generated_at, slide_image_urls, caption, hashtags, ig_angles(axis, hook)'
    )
    .eq('status', 'draft')
    .order('generated_at', { ascending: true })
    .limit(20)

  const typedPosts = (posts ?? []).map((p) => ({
    ...p,
    ig_angles: Array.isArray(p.ig_angles) ? p.ig_angles[0] : p.ig_angles
  })) as unknown as PilotPost[]

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

        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 24
          }}
        >
          <div>
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
              Pilot Mode · Swipe Validation
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: -0.5,
                margin: 0,
                backgroundImage: SPINLY_BRAND.gradient,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                lineHeight: 1
              }}
            >
              Inbox de drafts
            </h1>
          </div>
          <Link
            href="/admin/instagram/calendar"
            style={{
              fontSize: 13,
              color: SPINLY_BRAND.text.secondary,
              textDecoration: 'none',
              padding: '8px 14px',
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              borderRadius: 10
            }}
          >
            📅 Calendrier
          </Link>
        </header>

        <PilotValidator posts={typedPosts} />
      </div>
    </main>
  )
}
