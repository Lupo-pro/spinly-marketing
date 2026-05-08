import { SPINLY_BRAND } from '../../_styles/brand'
import type { Stats } from './types'

export function StatsLine({ stats }: { stats: Stats }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ color: '#4ADE80' }}>✓ {stats.approved}</span>
      <span style={{ color: SPINLY_BRAND.text.tertiary }}>·</span>
      <span style={{ color: '#EF4444' }}>✕ {stats.rejected}</span>
      <span style={{ color: SPINLY_BRAND.text.tertiary }}>·</span>
      <span style={{ color: SPINLY_BRAND.text.tertiary }}>⏭ {stats.skipped}</span>
      {stats.processing > 0 && (
        <>
          <span style={{ color: SPINLY_BRAND.text.tertiary }}>·</span>
          <span style={{ color: '#F59E2C', fontWeight: 700 }}>⚙️ {stats.processing}</span>
        </>
      )}
      {stats.failed > 0 && (
        <>
          <span style={{ color: SPINLY_BRAND.text.tertiary }}>·</span>
          <span style={{ color: '#EF4444', fontWeight: 700 }}>⚠ {stats.failed}</span>
        </>
      )}
    </span>
  )
}
