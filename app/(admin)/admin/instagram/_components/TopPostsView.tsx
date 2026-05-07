import Link from 'next/link'
import { SPINLY_BRAND } from '../_styles/brand'

export interface TopPostStat {
  post_id: string
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
  hours_since_publish: number | null
  post: {
    id: string
    content_type: 'carousel' | 'single_post' | 'story' | null
    caption: string | null
    slide_image_urls: string[] | null
    pe_published_at: string | null
    pilot_published_at: string | null
  } | null
}

const METRIC_LABELS = {
  engagement_rate: 'Eng %',
  reach: 'Reach',
  likes: 'Likes',
  saves: 'Saves'
} as const

export type TopPostsMetric = keyof typeof METRIC_LABELS

function formatMetric(value: number, metric: TopPostsMetric): string {
  if (metric === 'engagement_rate') return `${value}%`
  return value.toLocaleString('fr-FR')
}

export default function TopPostsView({
  posts,
  metric
}: {
  posts: TopPostStat[]
  metric: TopPostsMetric
}) {
  if (posts.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: SPINLY_BRAND.text.tertiary,
          background: 'rgba(255,255,255,0.02)',
          border: `1px dashed ${SPINLY_BRAND.border.hover}`,
          borderRadius: 12,
          fontSize: 13,
          lineHeight: 1.5
        }}
      >
        Pas encore de stats. Le cron tourne tous les jours à 9h Bogotá pour
        récupérer les performances. Tu peux aussi cliquer « Refresh stats » ci-dessus.
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 12
      }}
    >
      {posts.map((stat, i) => {
        const post = stat.post
        if (!post) return null
        const firstImage = Array.isArray(post.slide_image_urls)
          ? post.slide_image_urls[0]
          : null
        const value = stat[metric] as number | null
        const isPodium = i < 3

        return (
          <Link
            key={stat.post_id}
            href={`/admin/instagram/${post.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                background: SPINLY_BRAND.bg.surface,
                border: isPodium
                  ? `1px solid ${SPINLY_BRAND.border.accent}`
                  : `1px solid ${SPINLY_BRAND.border.default}`,
                borderRadius: 14,
                padding: 14,
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              {isPodium && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: 12,
                    background: SPINLY_BRAND.gradientWarm,
                    color: '#FFF',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  #{i + 1}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                {firstImage ? (
                  <div
                    style={{
                      width: 80,
                      aspectRatio: '4 / 5',
                      flexShrink: 0,
                      background: '#000',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={firstImage}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 80,
                      aspectRatio: '4 / 5',
                      flexShrink: 0,
                      background: '#0F0F0F',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24
                    }}
                  >
                    {post.content_type === 'story'
                      ? '📱'
                      : post.content_type === 'single_post'
                        ? '📷'
                        : '🎴'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: SPINLY_BRAND.text.secondary, marginBottom: 4 }}>
                    {post.content_type === 'carousel'
                      ? '🎴 Carrousel'
                      : post.content_type === 'single_post'
                        ? '📷 Post'
                        : '📱 Story'}
                    {stat.hours_since_publish !== null && (
                      <span style={{ marginLeft: 8 }}>
                        · J+{Math.round(stat.hours_since_publish / 24)}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      lineHeight: 1.3,
                      marginBottom: 8,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: SPINLY_BRAND.text.primary
                    }}
                  >
                    {post.caption?.split('\n')[0] || 'Sans titre'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      fontSize: 11,
                      color: SPINLY_BRAND.text.secondary,
                      flexWrap: 'wrap'
                    }}
                  >
                    <span>👁 {stat.reach.toLocaleString('fr-FR')}</span>
                    <span>❤️ {stat.likes}</span>
                    <span>💬 {stat.comments}</span>
                    <span>🔖 {stat.saves}</span>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 18,
                      fontWeight: 700,
                      backgroundImage: SPINLY_BRAND.gradientWarm,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      fontFamily: 'var(--font-display)',
                      lineHeight: 1
                    }}
                  >
                    {value === null ? '—' : formatMetric(value, metric)}
                    <span
                      style={{
                        fontSize: 10,
                        marginLeft: 6,
                        color: SPINLY_BRAND.text.tertiary,
                        fontFamily: 'var(--font-body)',
                        WebkitTextFillColor: SPINLY_BRAND.text.tertiary
                      }}
                    >
                      {METRIC_LABELS[metric]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
