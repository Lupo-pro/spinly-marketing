'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SPINLY_BRAND } from '../../_styles/brand'
import { PostPreview } from './PostPreview'
import { StatsLine } from './StatsLine'
import { ToastStack } from './ToastStack'
import { NoPostsScreen } from './NoPostsScreen'
import type { PilotPost, Stats, Toast } from './types'

export type { PilotPost } from './types'

// Race-condition errors we treat as no-ops (the post was already locked).
function isBenignDuplicate(error: string | undefined | null): boolean {
  if (!error) return false
  const lc = error.toLowerCase()
  return (
    lc.includes('already approved') ||
    lc.includes('already rejected') ||
    lc.includes('already processing') ||
    lc.includes('concurrent approve')
  )
}

export default function PilotValidator({ posts: initialPosts }: { posts: PilotPost[] }) {
  const router = useRouter()
  // Track every post the user has acted on this session. Once an ID lands
  // here it can never re-surface in the swipe queue, even if the server
  // refresh races and re-includes it for a moment.
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<Stats>({
    approved: 0,
    rejected: 0,
    skipped: 0,
    processing: 0,
    failed: 0
  })
  const [toasts, setToasts] = useState<Toast[]>([])

  const remainingPosts = useMemo(
    () => initialPosts.filter((p) => !processedIds.has(p.id)),
    [initialPosts, processedIds]
  )
  const post = remainingPosts[0]

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, 5000)
  }, [])

  const consumeId = useCallback((id: string) => {
    setProcessedIds((s) => {
      const next = new Set(s)
      next.add(id)
      return next
    })
  }, [])

  const handleRefreshQueue = useCallback(() => {
    setProcessedIds(new Set())
    router.refresh()
  }, [router])

  const handleApprove = useCallback(() => {
    if (!post) return
    const targetId = post.id

    consumeId(targetId)
    setStats((s) => ({
      ...s,
      approved: s.approved + 1,
      processing: s.processing + 1
    }))

    fetch('/api/ig/approve-pilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: targetId }),
      cache: 'no-store'
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          const errMsg = data?.error ?? `HTTP ${res.status}`
          if (isBenignDuplicate(errMsg)) {
            console.log(`[pilot] ${targetId} benign dup: ${errMsg}`)
            setStats((s) => ({ ...s, processing: Math.max(0, s.processing - 1) }))
            return
          }
          setStats((s) => ({
            ...s,
            approved: Math.max(0, s.approved - 1),
            processing: Math.max(0, s.processing - 1),
            failed: s.failed + 1
          }))
          showToast(`Échec approbation : ${errMsg}`, 'error')
          return
        }
        setTimeout(() => {
          setStats((s) => ({ ...s, processing: Math.max(0, s.processing - 1) }))
        }, 1500)
      })
      .catch((err) => {
        setStats((s) => ({
          ...s,
          approved: Math.max(0, s.approved - 1),
          processing: Math.max(0, s.processing - 1),
          failed: s.failed + 1
        }))
        showToast(`Erreur réseau : ${err instanceof Error ? err.message : String(err)}`, 'error')
      })
  }, [post, consumeId, showToast])

  const handleReject = useCallback(() => {
    if (!post) return
    const targetId = post.id

    consumeId(targetId)
    setStats((s) => ({ ...s, rejected: s.rejected + 1 }))

    fetch('/api/ig/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: targetId }),
      cache: 'no-store'
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const errMsg = data?.error ?? `HTTP ${res.status}`
          if (isBenignDuplicate(errMsg)) {
            console.log(`[pilot] ${targetId} reject benign dup: ${errMsg}`)
            return
          }
          setStats((s) => ({
            ...s,
            rejected: Math.max(0, s.rejected - 1),
            failed: s.failed + 1
          }))
          showToast(`Échec rejet : ${errMsg}`, 'error')
        }
      })
      .catch((err) => {
        setStats((s) => ({
          ...s,
          rejected: Math.max(0, s.rejected - 1),
          failed: s.failed + 1
        }))
        showToast(`Erreur réseau : ${err instanceof Error ? err.message : String(err)}`, 'error')
      })
  }, [post, consumeId, showToast])

  const handleSkip = useCallback(() => {
    if (!post) return
    consumeId(post.id)
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }))
  }, [post, consumeId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleApprove()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleReject()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        handleSkip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleApprove, handleReject, handleSkip])

  if (!post) {
    return (
      <>
        <NoPostsScreen stats={stats} onRefresh={handleRefreshQueue} />
        <ToastStack toasts={toasts} />
      </>
    )
  }

  return (
    <>
      <div className="spinly-pilot-grid">
        <div
          style={{
            background: SPINLY_BRAND.bg.surface,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            borderRadius: 14,
            padding: 22
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              fontSize: 11,
              color: SPINLY_BRAND.text.secondary,
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontWeight: 600,
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <span>
              POST {processedIds.size + 1} / {initialPosts.length}
            </span>
            <StatsLine stats={stats} />
          </div>
          <PostPreview post={post} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            type="button"
            onClick={handleApprove}
            style={{
              background: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)',
              border: 'none',
              color: '#FFF',
              padding: 24,
              borderRadius: 14,
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-display)'
            }}
          >
            <div style={{ fontSize: 32 }}>✓</div>
            <div>APPROUVER</div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.85,
                fontWeight: 500,
                fontFamily: 'var(--font-body)'
              }}
            >
              render + schedule + publie auto (en arrière-plan)
            </div>
          </button>

          <button
            type="button"
            onClick={handleReject}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              padding: 16,
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ REJETER
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: `1px dashed ${SPINLY_BRAND.border.hover}`,
              color: SPINLY_BRAND.text.tertiary,
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: 44
            }}
          >
            ⏭ Reporter à plus tard
          </button>

          <Link
            href={`/admin/instagram/${post.id}`}
            style={{
              background: SPINLY_BRAND.bg.surface,
              border: `1px solid ${SPINLY_BRAND.border.default}`,
              color: SPINLY_BRAND.text.secondary,
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 500,
              textAlign: 'center',
              textDecoration: 'none',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✏️ Édition manuelle (sortir du pilot)
          </Link>

          <div
            style={{
              marginTop: 'auto',
              paddingTop: 16,
              borderTop: `1px solid ${SPINLY_BRAND.border.default}`,
              fontSize: 11,
              color: SPINLY_BRAND.text.tertiary,
              textAlign: 'center',
              lineHeight: 1.7
            }}
          >
            <Kbd>→</Kbd> approuve · <Kbd>←</Kbd> rejette · <Kbd>↑</Kbd> skip
          </div>
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        background: 'rgba(255,255,255,0.08)',
        padding: '2px 6px',
        borderRadius: 4
      }}
    >
      {children}
    </kbd>
  )
}
