'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import DatePicker from './DatePicker'
import { SPINLY_BRAND } from '../_styles/brand'
import { ConfirmModal } from './ui/ConfirmModal'
import { StatusPill, type StatusKind } from './ui/StatusPill'

const ALL_PLATFORMS: { key: string; icon: string; label: string }[] = [
  { key: 'instagram', icon: '📷', label: 'Instagram' },
  { key: 'facebook', icon: '👥', label: 'Facebook' },
  { key: 'threads', icon: '🧵', label: 'Threads' },
  { key: 'tiktok', icon: '🎵', label: 'TikTok' },
  { key: 'linkedin', icon: '💼', label: 'LinkedIn' },
  { key: 'x', icon: '🐦', label: 'X' }
]

interface Props {
  postId: string
  status: string
  contentType: 'carousel' | 'single_post' | 'story'
  hasRendered: boolean
  peStatus: string | null
  peScheduledFor: string | null
  peError: string | null
  peDestinations: { platform: string; status: string; permalink?: string }[] | null
}

const KNOWN_STATUSES: StatusKind[] = [
  'draft',
  'approved',
  'rejected',
  'queued',
  'scheduled',
  'publishing',
  'processing',
  'published',
  'partial',
  'failed'
]

function PeStatusPill({ peStatus }: { peStatus: string }) {
  const safe: StatusKind = (KNOWN_STATUSES as string[]).includes(peStatus)
    ? (peStatus as StatusKind)
    : 'draft'
  return <StatusPill status={safe} size="md" />
}

export default function PublishButton({
  postId,
  status,
  contentType,
  hasRendered,
  peStatus,
  peScheduledFor,
  peError,
  peDestinations
}: Props) {
  const router = useRouter()
  const [platforms, setPlatforms] = useState<string[]>(
    contentType === 'story' ? ['instagram'] : ['instagram', 'facebook']
  )
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false) // belt-and-suspenders against double-clicks

  function publish() {
    if (inFlight.current || isPending) return
    setError(null)

    const scheduledFor = scheduledAt ? scheduledAt.toISOString() : undefined

    inFlight.current = true
    startTransition(async () => {
      try {
        const res = await fetch('/api/ig/publish-pe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, platforms, scheduledFor })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          setError(data.error || `HTTP ${res.status}`)
          return
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        inFlight.current = false
      }
    })
  }

  // ───── Terminal / in-flight states ─────
  if (peStatus === 'published' || peStatus === 'partial') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PeStatusPill peStatus={peStatus} />
        {peDestinations && peDestinations.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {peDestinations.map((d, i) => (
              <li key={i} style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary }}>
                {d.platform} —{' '}
                {d.permalink ? (
                  <a
                    href={d.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SPINLY_BRAND.text.primary, textDecoration: 'underline' }}
                  >
                    {d.status}
                  </a>
                ) : (
                  <span>{d.status}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <RefreshStatusButton postId={postId} />
      </div>
    )
  }

  if (peStatus === 'scheduled' && peScheduledFor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PeStatusPill peStatus={peStatus} />
        <p style={{ fontSize: 13, color: SPINLY_BRAND.text.primary, margin: 0 }}>
          Programmé pour le{' '}
          <strong>
            {format(new Date(peScheduledFor), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
          </strong>
        </p>
        <RefreshStatusButton postId={postId} />
      </div>
    )
  }

  if (peStatus === 'queued' || peStatus === 'publishing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PeStatusPill peStatus={peStatus} />
        <p style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, margin: 0 }}>
          La page se rafraîchit automatiquement toutes les 15 secondes.
        </p>
        <RefreshStatusButton postId={postId} />
      </div>
    )
  }

  if (peStatus === 'failed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PeStatusPill peStatus="failed" />
        {peError && (
          <div
            style={{
              fontSize: 12,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#FCA5A5'
            }}
          >
            {peError}
          </div>
        )}
        <p style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, margin: 0 }}>
          ⚠️ PostEverywhere peut avoir publié quand même côté serveur. Vérifie sur
          Instagram. Une fois confirmé, <strong>Reset state</strong> pour pouvoir
          republier sans dupliquer.
        </p>
        <ResetStateButton postId={postId} />
      </div>
    )
  }

  // ───── Gates ─────
  if (status !== 'approved') {
    return (
      <p style={{ fontSize: 13, color: SPINLY_BRAND.text.secondary, margin: 0 }}>
        Approuve le post avant de publier.
      </p>
    )
  }
  if (!hasRendered) {
    return (
      <p style={{ fontSize: 13, color: SPINLY_BRAND.text.secondary, margin: 0 }}>
        Render les visuels avant de publier.
      </p>
    )
  }

  // ───── Publish form ─────
  const buttonLabel = isPending
    ? '⏳ Publication en cours… (peut prendre 30-50s)'
    : scheduledAt
      ? '📅 Programmer la publication'
      : '🚀 Publier maintenant'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            color: SPINLY_BRAND.text.secondary,
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          Plateformes
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_PLATFORMS.map(({ key, icon, label }) => {
            const active = platforms.includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (active) setPlatforms(platforms.filter((p) => p !== key))
                  else setPlatforms([...platforms, key])
                }}
                style={{
                  background: active ? 'rgba(245, 158, 44, 0.15)' : SPINLY_BRAND.bg.surface,
                  border: `1px solid ${active ? SPINLY_BRAND.border.accent : SPINLY_BRAND.border.default}`,
                  color: active ? '#F59E2C' : SPINLY_BRAND.text.primary,
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: SPINLY_BRAND.text.tertiary, margin: '6px 0 0' }}>
          Coches uniquement les plateformes connectées dans PostEverywhere.
        </p>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            color: SPINLY_BRAND.text.secondary,
            textTransform: 'uppercase',
            marginBottom: 8
          }}
        >
          Quand publier
        </div>
        <DatePicker value={scheduledAt} onChange={setScheduledAt} />
      </div>

      <button
        type="button"
        onClick={publish}
        disabled={isPending || platforms.length === 0}
        aria-busy={isPending}
        style={{
          background: SPINLY_BRAND.gradientWarm,
          border: 'none',
          color: SPINLY_BRAND.text.primary,
          padding: '14px 18px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: isPending || platforms.length === 0 ? 'not-allowed' : 'pointer',
          opacity: isPending || platforms.length === 0 ? 0.6 : 1,
          minHeight: 48,
          transition: 'opacity 0.15s'
        }}
      >
        {buttonLabel}
      </button>

      {error && (
        <p style={{ color: '#FCA5A5', fontSize: 13, margin: 0 }}>❌ {error}</p>
      )}
    </div>
  )
}

function ResetStateButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function runReset() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/ig/reset-pe-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          setError(data.error || `HTTP ${res.status}`)
          return
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        aria-label="Réinitialiser l'état"
        aria-busy={isPending}
        style={{
          background: SPINLY_BRAND.bg.surface,
          border: `1px solid ${SPINLY_BRAND.border.default}`,
          color: SPINLY_BRAND.text.primary,
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.5 : 1,
          minHeight: 44
        }}
      >
        {isPending ? 'Reset…' : 'Reset state'}
      </button>
      {error && (
        <p style={{ fontSize: 11, color: '#FCA5A5', margin: '6px 0 0' }}>{error}</p>
      )}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runReset}
        title="Reset state PostEverywhere ?"
        description="Tous les pe_* fields seront vidés. À ne faire que si tu as confirmé sur Instagram qu'aucun post n'a été publié (ou que tu as supprimé les doublons)."
        confirmLabel="Reset state"
        variant="destructive"
      />
    </div>
  )
}

function RefreshStatusButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/ig/check-pe-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          setError(data.error || `HTTP ${res.status}`)
          return
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        aria-label="Rafraîchir le statut"
        aria-busy={isPending}
        style={{
          fontSize: 12,
          color: SPINLY_BRAND.text.secondary,
          background: 'transparent',
          border: 'none',
          textDecoration: 'underline',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.5 : 1,
          padding: '8px 0',
          minHeight: 32,
          textAlign: 'left'
        }}
      >
        {isPending ? 'Refresh…' : 'Refresh status'}
      </button>
      {error && (
        <p style={{ fontSize: 11, color: '#FCA5A5', margin: '6px 0 0' }}>{error}</p>
      )}
    </div>
  )
}
