import { SPINLY_BRAND } from '../_styles/brand'

interface Props {
  drafts: number
  approved: number
  scheduled: number
  published: number
}

export default function StatsBar({ drafts, approved, scheduled, published }: Props) {
  const stats = [
    { label: 'DRAFTS', value: drafts, color: SPINLY_BRAND.text.secondary },
    { label: 'APPROVED', value: approved, color: SPINLY_BRAND.text.primary },
    { label: 'SCHEDULED', value: scheduled, color: '#60A5FA' },
    { label: 'PUBLISHED', value: published, color: '#4ADE80' }
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
              fontSize: 26,
              fontWeight: 700,
              color: s.color,
              fontFamily: 'var(--font-display)',
              lineHeight: 1
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
