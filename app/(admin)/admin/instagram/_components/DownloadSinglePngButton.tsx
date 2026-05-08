'use client'

import { useState } from 'react'
import { SPINLY_BRAND } from '../_styles/brand'

interface Props {
  url: string | null
  postId: string
  hasRendered: boolean
}

// Direct download of the single PNG. The Storage URL is already public so we
// don't need a server route — the browser handles `download` attribute on <a>.
export default function DownloadSinglePngButton({ url, postId, hasRendered }: Props) {
  const [hover, setHover] = useState(false)

  if (!hasRendered || !url) {
    return (
      <button
        type="button"
        disabled
        style={{
          padding: '10px 16px',
          background: SPINLY_BRAND.bg.surface,
          color: SPINLY_BRAND.text.tertiary,
          borderRadius: 10,
          fontWeight: 500,
          fontSize: 13,
          border: `1px solid ${SPINLY_BRAND.border.default}`,
          cursor: 'not-allowed',
          minHeight: 44
        }}
      >
        PNG indisponible (slide non rendue)
      </button>
    )
  }

  return (
    <a
      href={url}
      download={`spinly-${postId.slice(0, 8)}.png`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: SPINLY_BRAND.gradientWarm,
        color: '#FFFFFF',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 13,
        textDecoration: 'none',
        opacity: hover ? 0.9 : 1,
        minHeight: 44,
        transition: 'opacity 0.15s ease'
      }}
    >
      <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Télécharger PNG
    </a>
  )
}
