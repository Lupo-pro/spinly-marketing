'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SPINLY_BRAND } from '../_styles/brand'

export type StatsType = 'all' | 'carousel' | 'single_post' | 'story'

const TABS: { key: StatsType; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'carousel', label: '🎴 Carrousels' },
  { key: 'single_post', label: '📷 Posts' },
  { key: 'story', label: '📱 Stories' }
]

export function StatsTypeFilter() {
  const params = useSearchParams()
  const current = (params.get('type') || 'all') as StatsType

  return (
    <div
      role="tablist"
      aria-label="Filtre par type de contenu"
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginBottom: 16
      }}
    >
      {TABS.map((tab) => {
        const active = tab.key === current
        const href = tab.key === 'all' ? '/admin/instagram/stats' : `/admin/instagram/stats?type=${tab.key}`
        return (
          <Link
            key={tab.key}
            href={href}
            role="tab"
            aria-selected={active}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              background: active
                ? 'rgba(245, 158, 44, 0.15)'
                : SPINLY_BRAND.bg.surface,
              color: active ? '#F59E2C' : SPINLY_BRAND.text.primary,
              border: `1px solid ${active ? SPINLY_BRAND.border.accent : SPINLY_BRAND.border.default}`,
              textDecoration: 'none',
              minHeight: 32,
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
