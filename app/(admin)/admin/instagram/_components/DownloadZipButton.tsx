'use client'

import { useState } from 'react'
import { SPINLY_BRAND } from '../_styles/brand'

interface Props {
  postId: string
  hasRendered: boolean
}

export default function DownloadZipButton({ postId, hasRendered }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [hover, setHover] = useState(false)

  if (!hasRendered) {
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
        ZIP indisponible (slides non rendues)
      </button>
    )
  }

  function handleDownload() {
    setDownloading(true)
    window.location.href = `/api/ig/download-zip/${postId}`
    setTimeout(() => setDownloading(false), 3000)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
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
        cursor: downloading ? 'not-allowed' : 'pointer',
        opacity: downloading ? 0.5 : hover ? 0.9 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        transition: 'opacity 0.15s ease'
      }}
    >
      {downloading ? (
        <>
          <span aria-hidden style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>
            ⏳
          </span>
          Préparation du ZIP…
        </>
      ) : (
        <>
          <svg
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Télécharger ZIP (10 PNG + caption)
        </>
      )}
    </button>
  )
}
