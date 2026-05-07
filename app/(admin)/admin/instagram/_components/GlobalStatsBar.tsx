import { SPINLY_BRAND } from '../_styles/brand'

interface Totals {
  count: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export default function GlobalStatsBar({
  totals,
  avgEngagement
}: {
  totals: Totals
  avgEngagement: number
}) {
  const stats = [
    { label: 'POSTS PUBLIÉS', value: totals.count, color: SPINLY_BRAND.text.primary },
    { label: 'REACH TOTAL', value: totals.reach, color: '#60A5FA' },
    { label: 'LIKES', value: totals.likes, color: '#E91E63' },
    { label: 'SAVES', value: totals.saves, color: '#F59E2C' },
    { label: 'ENG MOYEN', value: `${avgEngagement}%`, color: '#4ADE80' }
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: SPINLY_BRAND.bg.surface,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            borderRadius: 12,
            padding: 16
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: SPINLY_BRAND.text.secondary,
              textTransform: 'uppercase',
              marginBottom: 6
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: s.color,
              fontFamily: 'var(--font-display)',
              lineHeight: 1
            }}
          >
            {typeof s.value === 'number' ? s.value.toLocaleString('fr-FR') : s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
