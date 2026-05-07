import Link from 'next/link'
import { SPINLY_BRAND } from '../_styles/brand'

const TABS = [
  { value: 'all', label: 'All', icon: '◍' },
  { value: 'carousel', label: 'Carrousels', icon: '🎴' },
  { value: 'single_post', label: 'Posts', icon: '📷' },
  { value: 'story', label: 'Stories', icon: '📱' }
]

interface Props {
  currentFilter: string
  counts?: Record<string, number>
}

export default function ContentTypeFilter({ currentFilter, counts }: Props) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 4,
        marginBottom: 16,
        padding: 4,
        background: SPINLY_BRAND.bg.surface,
        border: `1px solid ${SPINLY_BRAND.border.default}`,
        borderRadius: 12
      }}
    >
      {TABS.map((tab) => {
        const isActive = currentFilter === tab.value
        const href = tab.value === 'all' ? '/admin/instagram' : `/admin/instagram?filter=${tab.value}`
        return (
          <Link
            key={tab.value}
            href={href}
            style={{
              background: isActive ? SPINLY_BRAND.bg.surfaceActive : 'transparent',
              color: isActive ? SPINLY_BRAND.text.primary : SPINLY_BRAND.text.secondary,
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {counts && counts[tab.value] !== undefined && (
              <span style={{ opacity: 0.6, fontSize: 12 }}>{counts[tab.value]}</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
