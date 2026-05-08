import Link from 'next/link'
import { SPINLY_BRAND } from '../../_styles/brand'
import type { Stats } from './types'

export function NoPostsScreen({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '60px 24px',
        background: SPINLY_BRAND.bg.surface,
        border: `1px solid ${SPINLY_BRAND.border.default}`,
        borderRadius: 14
      }}
    >
      <div style={{ fontSize: 48 }}>🎉</div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          margin: 0
        }}
      >
        Tout est validé !
      </h2>
      <p
        style={{
          color: SPINLY_BRAND.text.secondary,
          margin: 0,
          fontSize: 14,
          textAlign: 'center'
        }}
      >
        Cette session :{' '}
        <span style={{ color: '#4ADE80', fontWeight: 700 }}>✓ {stats.approved}</span> approuvés ·{' '}
        <span style={{ color: '#EF4444', fontWeight: 700 }}>✕ {stats.rejected}</span> rejetés · ⏭{' '}
        {stats.skipped} skipped.
        {stats.processing > 0 && (
          <>
            <br />
            <span style={{ color: '#F59E2C' }}>
              ⚙️ {stats.processing} en cours de traitement en arrière-plan.
            </span>
          </>
        )}
        {stats.failed > 0 && (
          <>
            <br />
            <span style={{ color: '#EF4444' }}>⚠ {stats.failed} échec(s) — voir les toasts.</span>
          </>
        )}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onRefresh}
          style={{
            background: SPINLY_BRAND.gradientWarm,
            color: '#FFF',
            padding: '12px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            minHeight: 44
          }}
        >
          🔄 Recharger la liste
        </button>
        <Link
          href="/admin/instagram/calendar"
          style={{
            background: SPINLY_BRAND.bg.surface,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            color: SPINLY_BRAND.text.primary,
            padding: '12px 18px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          📅 Voir le calendrier
        </Link>
      </div>
    </div>
  )
}
