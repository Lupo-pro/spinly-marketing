'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SPINLY_BRAND } from '../_styles/brand'

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

export interface PilotPost {
  id: string
  caption: string
  hashtags: string[] | null
  content_type: 'carousel' | 'single_post' | 'story' | null
  slides_json: unknown
  slide_image_urls: string[] | null
  generated_at: string
  ig_angles?: { axis: string; hook: string } | null
}

interface Toast {
  id: string
  message: string
  type: 'error' | 'success'
}

interface Stats {
  approved: number
  rejected: number
  skipped: number
  processing: number
  failed: number
}

function PostPreview({ post }: { post: PilotPost }) {
  const ctype = (post.content_type ?? 'carousel') as keyof typeof SPINLY_BRAND.contentType
  const meta = SPINLY_BRAND.contentType[ctype]
  const slideUrls = Array.isArray(post.slide_image_urls) ? post.slide_image_urls : []
  const firstUrl = slideUrls[0]
  const aspectRatio = ctype === 'story' ? '9 / 16' : '4 / 5'

  let hook = post.caption?.split('\n')[0] || 'Sans titre'
  try {
    const slides = (post.slides_json ?? []) as Array<{ type?: string; title?: string }>
    const first = slides[0]
    if (first?.type === 'hook' && first.title) hook = first.title
  } catch {
    // ignore
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          flexWrap: 'wrap'
        }}
      >
        <span
          style={{
            background: meta.bg,
            color: meta.fg,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5
          }}
        >
          {meta.icon} {meta.label.toUpperCase()}
        </span>
        {post.ig_angles && (
          <span style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary }}>
            <span style={{ fontFamily: 'monospace' }}>{post.ig_angles.axis}</span> ·{' '}
            {post.ig_angles.hook}
          </span>
        )}
      </div>

      <div
        style={{
          background: '#000',
          borderRadius: 12,
          aspectRatio,
          maxWidth: 420,
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {firstUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: SPINLY_BRAND.text.tertiary,
              fontSize: 13,
              lineHeight: 1.5
            }}
          >
            ⏳ Pas encore rendu
            <div style={{ fontSize: 11, marginTop: 10, color: SPINLY_BRAND.text.secondary }}>
              Le rendering se lancera automatiquement à l’approbation.
            </div>
          </div>
        )}
        {slideUrls.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              right: 12,
              fontSize: 11,
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(0,0,0,0.5)',
              padding: '3px 8px',
              borderRadius: 4
            }}
          >
            1/{slideUrls.length}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.4,
          color: SPINLY_BRAND.text.primary
        }}
      >
        {hook.replace(/\*([^*]+)\*/g, '$1')}
      </div>

      {post.caption && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: SPINLY_BRAND.text.secondary,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {post.caption}
        </p>
      )}
    </>
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

  // The visible queue: server list minus anything already swiped.
  const remainingPosts = useMemo(
    () => initialPosts.filter((p) => !processedIds.has(p.id)),
    [initialPosts, processedIds]
  )
  // Always validate from the head of the remaining queue. No currentIndex —
  // skipping just appends to processedIds with a 'skipped' marker so the
  // post drops out and the next one slides up.
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
    // Forget what we processed locally and re-pull the server list. Useful
    // when a fresh batch was generated mid-session.
    setProcessedIds(new Set())
    router.refresh()
  }, [router])

  const handleApprove = useCallback(() => {
    if (!post) return
    const targetId = post.id

    // Drop the post from the queue immediately — it will never resurface
    // even if the server response is delayed or the server refreshes.
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
            // Race condition: backend says it was already approved/locked.
            // The ID stays in processedIds either way — that's the right
            // outcome from the user's POV. Just close out the spinner.
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

function StatsLine({ stats }: { stats: Stats }) {
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

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 400
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(74, 222, 128, 0.95)',
            color: '#FFF',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            lineHeight: 1.4
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

function NoPostsScreen({ stats, onRefresh }: { stats: Stats; onRefresh: () => void }) {
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
      <p style={{ color: SPINLY_BRAND.text.secondary, margin: 0, fontSize: 14, textAlign: 'center' }}>
        Cette session :{' '}
        <span style={{ color: '#4ADE80', fontWeight: 700 }}>✓ {stats.approved}</span> approuvés ·{' '}
        <span style={{ color: '#EF4444', fontWeight: 700 }}>✕ {stats.rejected}</span> rejetés ·{' '}
        ⏭ {stats.skipped} skipped.
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
