'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { SPINLY_BRAND } from '../_styles/brand'

interface RefreshResult {
  ok?: boolean
  checked?: number
  updated?: number
  errors?: number
  error?: string
}

export default function RefreshStatsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const [result, setResult] = useState<RefreshResult | null>(null)

  async function refresh() {
    if (loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ig/refresh-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store'
      })
      const data = (await res.json().catch(() => ({}))) as RefreshResult
      setResult(data)
      if (res.ok) startTransition(() => router.refresh())
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap'
      }}
    >
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        aria-label="Rafraîchir les stats"
        aria-busy={loading}
        style={{
          background: SPINLY_BRAND.bg.surface,
          border: `1px solid ${SPINLY_BRAND.border.hover}`,
          color: SPINLY_BRAND.text.primary,
          padding: '10px 16px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          opacity: loading ? 0.6 : 1,
          minHeight: 44
        }}
      >
        {loading ? (
          '⏳ Refresh en cours…'
        ) : (
          <>
            <RefreshCw size={14} aria-hidden /> Refresh stats maintenant
          </>
        )}
      </button>
      {result && (
        <span style={{ fontSize: 12, color: SPINLY_BRAND.text.secondary }}>
          {result.error ? (
            <span style={{ color: '#FCA5A5' }}>❌ {result.error}</span>
          ) : (
            <>
              ✅ {result.updated ?? 0}/{result.checked ?? 0} mis à jour
              {(result.errors ?? 0) > 0 && (
                <span style={{ color: '#FCA5A5' }}> · {result.errors} erreurs</span>
              )}
            </>
          )}
        </span>
      )}
    </div>
  )
}
