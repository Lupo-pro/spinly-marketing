'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { schedulePostAction } from '../actions'
import { SPINLY_BRAND } from '../_styles/brand'

export default function ScheduleButton({
  postId,
  status,
  hasRendered,
  scheduledFor
}: {
  postId: string
  status: string
  hasRendered: boolean
  scheduledFor?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hover, setHover] = useState(false)

  if (status === 'scheduled' && scheduledFor) {
    const d = new Date(scheduledFor)
    return (
      <div style={{ fontSize: 13, color: SPINLY_BRAND.status.scheduled.fg }}>
        Programmé pour le {d.toLocaleDateString('fr-FR')} à{' '}
        {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    )
  }
  if (status === 'published' || status === 'failed') {
    return null
  }

  if (status !== 'approved' || !hasRendered) {
    return (
      <div style={{ fontSize: 13, color: SPINLY_BRAND.text.tertiary }}>
        Approuve + rends les visuels pour pouvoir programmer la publication.
      </div>
    )
  }

  function handleClick() {
    setResult(null)
    setError(null)
    startTransition(async () => {
      const r = await schedulePostAction(postId)
      if (r.ok && r.scheduledFor) {
        const d = new Date(r.scheduledFor)
        setResult(
          `Programmé pour le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}`
        )
        router.refresh()
      } else {
        setError(r.error || 'Erreur inconnue')
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: '10px 16px',
          background: SPINLY_BRAND.gradientWarm,
          color: '#FFFFFF',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 13,
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.4 : hover ? 0.9 : 1,
          minHeight: 44,
          transition: 'opacity 0.15s ease'
        }}
      >
        {isPending ? 'Programmation…' : 'Programmer la publication'}
      </button>
      {result && (
        <p style={{ fontSize: 13, marginTop: 8, color: SPINLY_BRAND.status.published.fg }}>
          {result}
        </p>
      )}
      {error && (
        <p style={{ fontSize: 13, marginTop: 8, color: SPINLY_BRAND.status.failed.fg }}>{error}</p>
      )}
    </div>
  )
}
