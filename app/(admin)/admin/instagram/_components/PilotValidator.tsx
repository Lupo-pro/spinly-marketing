'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SPINLY_BRAND } from '../_styles/brand'

type Step = 'idle' | 'rendering' | 'scheduling' | 'publishing' | 'done' | 'error'

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

interface ScheduledInfo {
  time: string
  platforms: string[]
}

function formatBogota(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota'
  })
}

function ProgressBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          height: 4,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: SPINLY_BRAND.gradientWarm,
            transition: 'width 0.4s'
          }}
        />
      </div>
    </div>
  )
}

function PostPreview({ post }: { post: PilotPost }) {
  const ctype = (post.content_type ?? 'carousel') as keyof typeof SPINLY_BRAND.contentType
  const meta = SPINLY_BRAND.contentType[ctype]
  const slideUrls = Array.isArray(post.slide_image_urls) ? post.slide_image_urls : []
  const firstUrl = slideUrls[0]
  const aspectRatio = ctype === 'story' ? '9 / 16' : '4 / 5'

  // Parse slides_json defensively for hook fallback.
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

export default function PilotValidator({ posts }: { posts: PilotPost[] }) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [scheduledInfo, setScheduledInfo] = useState<ScheduledInfo | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [stats, setStats] = useState({ approved: 0, rejected: 0, skipped: 0 })

  const post = posts[currentIndex]

  const goNext = useCallback(() => {
    setProcessing(false)
    setStep('idle')
    setScheduledInfo(null)
    setErrorMsg(null)
    if (currentIndex < posts.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      router.refresh()
    }
  }, [currentIndex, posts.length, router])

  const handleApprove = useCallback(async () => {
    if (processing || !post) return
    setProcessing(true)
    setErrorMsg(null)
    setStep('rendering')

    let pollTimer: ReturnType<typeof setInterval> | null = null
    try {
      // Poll status alongside the approve call so the UI tracks progress.
      pollTimer = setInterval(async () => {
        try {
          const r = await fetch(`/api/ig/post-status?id=${post.id}`, { cache: 'no-store' })
          if (!r.ok) return
          const s = await r.json()
          if (s.is_scheduled) {
            setStep('done')
            setScheduledInfo({
              time: s.pilot_scheduled_at ?? s.pe_scheduled_for ?? new Date().toISOString(),
              platforms: s.pilot_platforms ?? []
            })
          } else if (s.has_render) {
            setStep('scheduling')
          }
        } catch {
          // best-effort polling
        }
      }, 2000)

      const res = await fetch('/api/ig/approve-pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setStep('error')
        setErrorMsg(data?.error ?? `HTTP ${res.status}`)
        setProcessing(false)
        return
      }

      setStep('done')
      setScheduledInfo({
        time: data.scheduledAt,
        platforms: data.platforms ?? []
      })
      setStats((s) => ({ ...s, approved: s.approved + 1 }))
      setTimeout(goNext, 1800)
    } catch (err) {
      setStep('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setProcessing(false)
    } finally {
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [processing, post, goNext])

  const handleReject = useCallback(async () => {
    if (processing || !post) return
    setProcessing(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/ig/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data?.error ?? `HTTP ${res.status}`)
        setProcessing(false)
        return
      }
      setStats((s) => ({ ...s, rejected: s.rejected + 1 }))
      goNext()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setProcessing(false)
    }
  }, [processing, post, goNext])

  const handleSkip = useCallback(() => {
    if (processing) return
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }))
    goNext()
  }, [processing, goNext])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (processing) return
      // Don't hijack typing in inputs/textareas (won't happen on this page,
      // but guards against future adds).
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
  }, [processing, handleApprove, handleReject, handleSkip])

  if (!post) {
    return <NoPostsScreen stats={stats} />
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 24 }}>
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
            fontWeight: 600
          }}
        >
          <span>
            POST {currentIndex + 1} / {posts.length}
          </span>
          <span>
            ✓ {stats.approved} · ✕ {stats.rejected} · ⏭ {stats.skipped}
          </span>
        </div>
        <PostPreview post={post} />

        {step === 'rendering' && <ProgressBar label="🎨 Rendering des slides…" percent={33} />}
        {step === 'scheduling' && (
          <ProgressBar label="📅 Calcul du créneau optimal…" percent={66} />
        )}
        {step === 'publishing' && (
          <ProgressBar label="📡 Envoi à PostEverywhere…" percent={88} />
        )}
        {step === 'done' && scheduledInfo && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              borderRadius: 10
            }}
          >
            <div style={{ fontSize: 11, color: '#4ADE80', fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
              ✓ PROGRAMMÉ
            </div>
            <div style={{ fontSize: 14 }}>{formatBogota(scheduledInfo.time)} (Bogotá)</div>
            {scheduledInfo.platforms.length > 0 && (
              <div style={{ fontSize: 11, color: SPINLY_BRAND.text.secondary, marginTop: 4 }}>
                → {scheduledInfo.platforms.join(' · ')}
              </div>
            )}
          </div>
        )}
        {step === 'error' && errorMsg && (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 10
            }}
          >
            <div style={{ fontSize: 11, color: '#FCA5A5', fontWeight: 700, marginBottom: 4 }}>
              ✕ ÉCHEC
            </div>
            <div style={{ fontSize: 13, color: '#FECACA' }}>{errorMsg}</div>
            <div style={{ fontSize: 11, color: SPINLY_BRAND.text.tertiary, marginTop: 6 }}>
              Le post est revenu à <code>draft</code>. Tu peux retenter.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button
          type="button"
          onClick={handleApprove}
          disabled={processing}
          style={{
            background: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)',
            border: 'none',
            color: '#FFF',
            padding: 24,
            borderRadius: 14,
            fontSize: 18,
            fontWeight: 900,
            cursor: processing ? 'not-allowed' : 'pointer',
            opacity: processing ? 0.6 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-display)'
          }}
        >
          <div style={{ fontSize: 32 }}>✓</div>
          <div>APPROUVER</div>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 500, fontFamily: 'var(--font-body)' }}>
            render + schedule + publie auto
          </div>
        </button>

        <button
          type="button"
          onClick={handleReject}
          disabled={processing}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            padding: 16,
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 700,
            cursor: processing ? 'not-allowed' : 'pointer',
            opacity: processing ? 0.6 : 1
          }}
        >
          ✕ REJETER
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={processing}
          style={{
            background: 'transparent',
            border: `1px dashed ${SPINLY_BRAND.border.hover}`,
            color: SPINLY_BRAND.text.tertiary,
            padding: 10,
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 500,
            cursor: processing ? 'not-allowed' : 'pointer'
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
            padding: 12,
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'center',
            textDecoration: 'none'
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
          <kbd
            style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '2px 6px',
              borderRadius: 4
            }}
          >
            →
          </kbd>{' '}
          approuve ·{' '}
          <kbd
            style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '2px 6px',
              borderRadius: 4
            }}
          >
            ←
          </kbd>{' '}
          rejette ·{' '}
          <kbd
            style={{
              background: 'rgba(255,255,255,0.08)',
              padding: '2px 6px',
              borderRadius: 4
            }}
          >
            ↑
          </kbd>{' '}
          skip
        </div>
      </div>
    </div>
  )
}

function NoPostsScreen({ stats }: { stats: { approved: number; rejected: number; skipped: number } }) {
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
        Inbox zéro
      </h2>
      <p style={{ color: SPINLY_BRAND.text.secondary, margin: 0, fontSize: 14 }}>
        Tous les drafts sont passés. Cette session : ✓ {stats.approved} approuvés · ✕{' '}
        {stats.rejected} rejetés · ⏭ {stats.skipped} skipped.
      </p>
      <Link
        href="/admin/instagram/calendar"
        style={{
          background: SPINLY_BRAND.gradientWarm,
          color: '#FFF',
          padding: '10px 18px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none'
        }}
      >
        📅 Voir le calendrier
      </Link>
    </div>
  )
}
