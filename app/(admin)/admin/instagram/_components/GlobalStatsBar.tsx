import { SPINLY_BRAND } from '../_styles/brand'
import { formatNumber } from '@/lib/format'
import { Sparkline } from './Sparkline'

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
  avgEngagement,
  dailyCounts
}: {
  totals: Totals
  avgEngagement: number
  dailyCounts?: number[]
}) {
  const stats = [
    { label: 'POSTS PUBLIÉS', value: totals.count, color: SPINLY_BRAND.text.primary },
    { label: 'REACH TOTAL', value: totals.reach, color: '#60A5FA' },
    { label: 'LIKES', value: totals.likes, color: '#E91E63' },
    { label: 'SAVES', value: totals.saves, color: '#F59E2C' },
    { label: 'ENG MOYEN', value: `${avgEngagement}%`, color: '#4ADE80' }
  ]

  const hasSeries = dailyCounts && dailyCounts.some((n) => n > 0)
  const totalIn30d = dailyCounts ? dailyCounts.reduce((a, b) => a + b, 0) : 0

  return (
    <div style={{ marginBottom: 24 }}>
      {hasSeries && dailyCounts && (
        <div
          style={{
            background: SPINLY_BRAND.bg.surface,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            borderRadius: 12,
            padding: '14px 16px 10px',
            marginBottom: 12
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 8,
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1.5,
                color: SPINLY_BRAND.text.secondary,
                textTransform: 'uppercase'
              }}
            >
              30 derniers jours · publication
            </span>
            <span style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary }}>
              {totalIn30d} post{totalIn30d > 1 ? 's' : ''} publié{totalIn30d > 1 ? 's' : ''}
            </span>
          </div>
          <Sparkline data={dailyCounts} height={48} ariaLabel="Posts publiés par jour sur 30 jours" />
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12
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
              {typeof s.value === 'number' ? formatNumber(s.value) : s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
