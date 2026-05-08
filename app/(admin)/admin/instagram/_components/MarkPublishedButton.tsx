'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAsPublishedAction, unmarkAsPublishedAction } from '../actions'
import { SPINLY_BRAND } from '../_styles/brand'
import { ConfirmModal } from './ui/ConfirmModal'

interface Props {
  postId: string
  status: string
  igPermalink?: string | null
  hasRendered: boolean
}

export default function MarkPublishedButton({
  postId,
  status,
  igPermalink,
  hasRendered
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [permalink, setPermalink] = useState(igPermalink || '')
  const [showInput, setShowInput] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoverPrimary, setHoverPrimary] = useState(false)
  const [hoverSecondary, setHoverSecondary] = useState(false)
  const [unmarkOpen, setUnmarkOpen] = useState(false)

  const errorColor = SPINLY_BRAND.status.failed.fg
  const successColor = SPINLY_BRAND.status.published.fg
  const successBg = SPINLY_BRAND.status.published.bg

  if (status === 'published') {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '4px 12px',
              background: successBg,
              color: successColor,
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${successColor}40`
            }}
          >
            ✓ Publié
          </span>
          {igPermalink && (
            <a
              href={igPermalink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: SPINLY_BRAND.text.secondary,
                textDecoration: 'underline',
                padding: '6px 0'
              }}
            >
              Voir sur Instagram →
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => setUnmarkOpen(true)}
          disabled={isPending}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 12,
            color: SPINLY_BRAND.text.tertiary,
            textDecoration: 'underline',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.5 : 1,
            padding: '6px 0',
            textAlign: 'left',
            alignSelf: 'flex-start'
          }}
        >
          Annuler le marquage
        </button>
        {error && <p style={{ fontSize: 12, color: errorColor, margin: 0 }}>{error}</p>}
        <ConfirmModal
          open={unmarkOpen}
          onClose={() => setUnmarkOpen(false)}
          onConfirm={() => {
            startTransition(async () => {
              const r = await unmarkAsPublishedAction(postId)
              if (!r.ok) setError(r.error)
              router.refresh()
            })
          }}
          title="Annuler le marquage publié ?"
          description='Le post repassera en statut "approved" et tu pourras le re-publier ou le re-programmer.'
          confirmLabel="Annuler le marquage"
          variant="destructive"
        />
      </div>
    )
  }

  if (status !== 'approved' || !hasRendered) {
    return (
      <p style={{ fontSize: 13, color: SPINLY_BRAND.text.tertiary, margin: 0 }}>
        Le post doit être approuvé et avoir ses 10 slides rendues pour pouvoir être marqué publié.
      </p>
    )
  }

  function handleMarkPublished() {
    setError(null)
    startTransition(async () => {
      const result = await markAsPublishedAction(postId, permalink.trim() || undefined)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setShowInput(false)
      router.refresh()
    })
  }

  if (showInput) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <input
          type="url"
          placeholder="https://www.instagram.com/p/… (optionnel)"
          value={permalink}
          onChange={(e) => setPermalink(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: SPINLY_BRAND.bg.base,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            borderRadius: 8,
            color: SPINLY_BRAND.text.primary,
            fontSize: 13,
            outline: 'none',
            minHeight: 44
          }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleMarkPublished}
            disabled={isPending}
            onMouseEnter={() => setHoverPrimary(true)}
            onMouseLeave={() => setHoverPrimary(false)}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: SPINLY_BRAND.gradientWarm,
              color: '#FFFFFF',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.5 : hoverPrimary ? 0.9 : 1,
              minHeight: 44
            }}
          >
            {isPending ? 'Marquage…' : 'Confirmer "Publié"'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false)
              setError(null)
            }}
            disabled={isPending}
            onMouseEnter={() => setHoverSecondary(true)}
            onMouseLeave={() => setHoverSecondary(false)}
            style={{
              padding: '10px 12px',
              background: hoverSecondary ? SPINLY_BRAND.bg.surfaceHover : SPINLY_BRAND.bg.surface,
              color: SPINLY_BRAND.text.primary,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.5 : 1,
              minHeight: 44
            }}
          >
            Annuler
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: errorColor, margin: 0 }}>{error}</p>}
        <p style={{ fontSize: 12, color: SPINLY_BRAND.text.tertiary, margin: 0 }}>
          Tu peux laisser le lien vide si tu n&apos;as pas encore l&apos;URL Instagram du post.
        </p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowInput(true)}
      onMouseEnter={() => setHoverPrimary(true)}
      onMouseLeave={() => setHoverPrimary(false)}
      style={{
        padding: '10px 16px',
        background: SPINLY_BRAND.gradientWarm,
        color: '#FFFFFF',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 13,
        border: 'none',
        cursor: 'pointer',
        opacity: hoverPrimary ? 0.9 : 1,
        minHeight: 44,
        transition: 'opacity 0.15s ease'
      }}
    >
      Marquer comme publié manuellement
    </button>
  )
}
