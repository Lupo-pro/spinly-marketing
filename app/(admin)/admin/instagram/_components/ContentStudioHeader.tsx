'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SPINLY_BRAND } from '../_styles/brand'

export default function ContentStudioHeader() {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (generating) return
    if (
      !confirm(
        'Lancer la génération de nouveaux drafts maintenant ? (~1 min, ~$0.05 d\'API Anthropic)'
      )
    ) {
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ig/generate-now', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`)
        return
      }
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  function handleRefresh() {
    startTransition(() => router.refresh())
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2,
              color: SPINLY_BRAND.text.secondary,
              textTransform: 'uppercase',
              marginBottom: 4
            }}
          >
            SPINLY MARKETING
          </div>
          <div
            style={{
              fontSize: 36,
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              letterSpacing: -0.5,
              backgroundImage: SPINLY_BRAND.gradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1
            }}
          >
            Content Studio
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleRefresh}
            style={{
              background: SPINLY_BRAND.bg.surface,
              border: `1px solid ${SPINLY_BRAND.border.hover}`,
              color: SPINLY_BRAND.text.primary,
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: SPINLY_BRAND.gradientWarm,
              border: 'none',
              color: SPINLY_BRAND.text.primary,
              padding: '10px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.6 : 1
            }}
          >
            {generating ? '⏳ Génération…' : '✨ Générer maintenant'}
          </button>
        </div>
      </div>
      {error && (
        <p style={{ marginTop: 12, color: '#EF4444', fontSize: 13 }}>❌ {error}</p>
      )}
    </div>
  )
}
