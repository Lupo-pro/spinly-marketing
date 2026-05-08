'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approvePost, rejectPost, regeneratePost } from '../../actions'
import { SPINLY_BRAND } from '../../_styles/brand'

type Hover = 'approve' | 'reject' | 'regen' | 'submit' | null

export default function PostActions({
  postId,
  status
}: {
  postId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [hover, setHover] = useState<Hover>(null)
  const canApprove = status === 'draft'

  function handleApprove() {
    startTransition(async () => {
      await approvePost(postId)
      router.refresh()
    })
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    const fd = new FormData()
    fd.set('reason', reason)
    startTransition(async () => {
      await rejectPost(postId, fd)
    })
  }

  function handleRegenerate() {
    if (!confirm('Régénérer ce carrousel ? Le contenu actuel sera écrasé.')) return
    startTransition(async () => {
      await regeneratePost(postId)
      router.refresh()
    })
  }

  const approvedStatus = SPINLY_BRAND.status.approved
  const rejectedStatus = SPINLY_BRAND.status.rejected

  return (
    <section
      style={{
        background: SPINLY_BRAND.bg.surface,
        border: `1px solid ${SPINLY_BRAND.border.default}`,
        borderRadius: 12,
        padding: 16
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending || !canApprove}
          onMouseEnter={() => setHover('approve')}
          onMouseLeave={() => setHover(null)}
          style={{
            padding: '10px 16px',
            background: approvedStatus.bg,
            color: approvedStatus.fg,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${approvedStatus.fg}40`,
            cursor: pending || !canApprove ? 'not-allowed' : 'pointer',
            opacity: pending || !canApprove ? 0.4 : hover === 'approve' ? 0.85 : 1,
            minHeight: 44,
            transition: 'opacity 0.15s ease'
          }}
        >
          {pending ? '...' : 'Approuver'}
        </button>

        <button
          type="button"
          onClick={() => setShowReject((v) => !v)}
          disabled={pending}
          onMouseEnter={() => setHover('reject')}
          onMouseLeave={() => setHover(null)}
          style={{
            padding: '10px 16px',
            background: rejectedStatus.bg,
            color: rejectedStatus.fg,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${rejectedStatus.fg}40`,
            cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.4 : hover === 'reject' ? 0.85 : 1,
            minHeight: 44,
            transition: 'opacity 0.15s ease'
          }}
        >
          Rejeter
        </button>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={pending}
          onMouseEnter={() => setHover('regen')}
          onMouseLeave={() => setHover(null)}
          style={{
            padding: '10px 16px',
            background: hover === 'regen' ? SPINLY_BRAND.bg.surfaceHover : SPINLY_BRAND.bg.surface,
            color: SPINLY_BRAND.text.primary,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.4 : 1,
            minHeight: 44,
            transition: 'background 0.15s ease'
          }}
        >
          {pending ? 'Régénération...' : 'Régénérer (Claude)'}
        </button>
      </div>

      {showReject && (
        <form onSubmit={handleReject} style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Raison du rejet..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: SPINLY_BRAND.bg.base,
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              borderRadius: 10,
              fontSize: 13,
              color: SPINLY_BRAND.text.primary,
              outline: 'none',
              minHeight: 44
            }}
          />
          <button
            type="submit"
            disabled={pending || !reason.trim()}
            onMouseEnter={() => setHover('submit')}
            onMouseLeave={() => setHover(null)}
            style={{
              padding: '10px 16px',
              background: rejectedStatus.fg,
              color: '#FFFFFF',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: pending || !reason.trim() ? 'not-allowed' : 'pointer',
              opacity: pending || !reason.trim() ? 0.4 : hover === 'submit' ? 0.9 : 1,
              minHeight: 44,
              transition: 'opacity 0.15s ease'
            }}
          >
            Confirmer
          </button>
        </form>
      )}
    </section>
  )
}
