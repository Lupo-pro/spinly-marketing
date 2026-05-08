import Link from 'next/link'
import { RefreshCw, Calendar, Sparkles } from 'lucide-react'
import { SPINLY_BRAND } from '../../_styles/brand'
import { EmptyState } from '../ui/EmptyState'
import type { Stats } from './types'

export function NoPostsScreen({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
  const sessionTotal = stats.approved + stats.rejected + stats.skipped
  const validatedSomething = sessionTotal > 0

  // Two distinct empty states:
  //  1. Started a session and finished it ("Tout est validé !" celebration)
  //  2. Page loaded with 0 drafts ("Pas encore de drafts" — generate CTA)
  if (!validatedSomething) {
    return (
      <EmptyState
        icon={<Sparkles size={40} aria-hidden style={{ color: '#F59E2C' }} />}
        title="Pas encore de drafts à valider"
        description="Le cron tourne tous les jours à 11h Bogotá pour générer une nouvelle inbox. Tu peux aussi générer manuellement depuis le Content Studio."
        cta={{ label: 'Aller au Content Studio', href: '/admin/instagram' }}
      />
    )
  }

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
      <div style={{ fontSize: 48 }} aria-hidden>
        🎉
      </div>
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
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <RefreshCw size={14} aria-hidden /> Recharger la liste
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
            alignItems: 'center',
            gap: 6
          }}
        >
          <Calendar size={14} aria-hidden /> Voir le calendrier
        </Link>
      </div>
    </div>
  )
}
