import Link from 'next/link'
import { getServerSupabase } from '@/lib/supabase/server'
import CalendarView, { type CalendarPost } from '../_components/CalendarView'
import { SPINLY_BRAND } from '../_styles/brand'

export const dynamic = 'force-dynamic'

const HORIZON_DAYS = 30

export default async function CalendarPage() {
  const supabase = getServerSupabase()
  const horizonEnd = new Date(Date.now() + HORIZON_DAYS * 86_400_000)

  const { data: posts } = await supabase
    .from('ig_posts')
    .select(
      'id, content_type, caption, pilot_scheduled_at, pilot_platforms, pe_status, slide_image_urls'
    )
    .not('pilot_scheduled_at', 'is', null)
    .gte('pilot_scheduled_at', new Date().toISOString())
    .lte('pilot_scheduled_at', horizonEnd.toISOString())
    .order('pilot_scheduled_at', { ascending: true })

  const typedPosts = (posts ?? []) as CalendarPost[]

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
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
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
              Pilot Mode · Agenda
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
              Calendrier 7 jours
            </h1>
            <p
              style={{
                fontSize: 13,
                color: SPINLY_BRAND.text.secondary,
                marginTop: 4
              }}
            >
              Tous les posts programmés via le pilot. {typedPosts.length} prévu
              {typedPosts.length > 1 ? 's' : ''} sur les 7 prochains jours · heures Bogotá.
            </p>
          </div>
          <Link
            href="/admin/instagram/pilot"
            style={{
              fontSize: 13,
              color: SPINLY_BRAND.text.primary,
              textDecoration: 'none',
              padding: '10px 16px',
              background: SPINLY_BRAND.gradientWarm,
              borderRadius: 10,
              fontWeight: 700
            }}
          >
            🚀 Mode Pilot
          </Link>
        </header>

        <CalendarView posts={typedPosts} horizonDays={HORIZON_DAYS} />
      </div>
    </main>
  )
}
