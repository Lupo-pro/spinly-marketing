'use client'

import { useState } from 'react'
import { SPINLY_BRAND } from '../_styles/brand'

interface Props {
  caption: string
  hashtags: string[]
}

type CopyTarget = 'caption' | 'hashtags' | 'full'

export default function CaptionBlock({ caption, hashtags }: Props) {
  const [copied, setCopied] = useState<CopyTarget | null>(null)
  const [hoverPrimary, setHoverPrimary] = useState(false)
  const [hoverSecondary, setHoverSecondary] = useState<CopyTarget | null>(null)

  const captionFull =
    caption + (hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '')

  async function copyText(text: string, what: CopyTarget) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {}
      document.body.removeChild(ta)
    }
    setCopied(what)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          background: SPINLY_BRAND.bg.surface,
          border: `1px solid ${SPINLY_BRAND.border.default}`,
          borderRadius: 12,
          padding: 16
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: SPINLY_BRAND.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 1,
              margin: 0
            }}
          >
            Caption + hashtags
          </h3>
          <button
            type="button"
            onClick={() => copyText(captionFull, 'full')}
            onMouseEnter={() => setHoverPrimary(true)}
            onMouseLeave={() => setHoverPrimary(false)}
            style={{
              padding: '8px 14px',
              background: SPINLY_BRAND.gradientWarm,
              color: '#FFFFFF',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              opacity: hoverPrimary ? 0.9 : 1,
              minHeight: 36,
              transition: 'opacity 0.15s ease'
            }}
          >
            {copied === 'full' ? '✓ Copié' : 'Copier tout'}
          </button>
        </div>
        <pre
          style={{
            color: SPINLY_BRAND.text.primary,
            fontSize: 13,
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            lineHeight: 1.6,
            maxHeight: 384,
            overflowY: 'auto',
            margin: 0
          }}
        >
          {captionFull}
        </pre>
        <div style={{ marginTop: 12, fontSize: 11, color: SPINLY_BRAND.text.tertiary }}>
          {captionFull.length} caractères · {hashtags.length} hashtags
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => copyText(caption, 'caption')}
          onMouseEnter={() => setHoverSecondary('caption')}
          onMouseLeave={() => setHoverSecondary(null)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background:
              hoverSecondary === 'caption'
                ? SPINLY_BRAND.bg.surfaceHover
                : SPINLY_BRAND.bg.surface,
            color: SPINLY_BRAND.text.primary,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            cursor: 'pointer',
            minHeight: 44,
            transition: 'background 0.15s ease'
          }}
        >
          {copied === 'caption' ? '✓ Caption copiée' : 'Copier caption seule'}
        </button>
        <button
          type="button"
          onClick={() => copyText(hashtags.join(' '), 'hashtags')}
          onMouseEnter={() => setHoverSecondary('hashtags')}
          onMouseLeave={() => setHoverSecondary(null)}
          style={{
            flex: 1,
            padding: '10px 12px',
            background:
              hoverSecondary === 'hashtags'
                ? SPINLY_BRAND.bg.surfaceHover
                : SPINLY_BRAND.bg.surface,
            color: SPINLY_BRAND.text.primary,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            border: `1px solid ${SPINLY_BRAND.border.default}`,
            cursor: 'pointer',
            minHeight: 44,
            transition: 'background 0.15s ease'
          }}
        >
          {copied === 'hashtags' ? '✓ Hashtags copiés' : 'Copier hashtags seuls'}
        </button>
      </div>
    </div>
  )
}
