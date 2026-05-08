'use client'

import { useState, useEffect } from 'react'
import { SPINLY_BRAND } from '../_styles/brand'

export default function SlidesGrid({ urls }: { urls: string[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxUrl(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  if (urls.length === 0) {
    return (
      <p style={{ color: SPINLY_BRAND.text.secondary, fontSize: 13 }}>
        Aucune slide rendue. Clique sur « Render slides » pour générer les visuels.
      </p>
    )
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12
        }}
      >
        {urls.map((url, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setLightboxUrl(url)}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              position: 'relative',
              aspectRatio: '4 / 5',
              background: '#000',
              borderRadius: 10,
              overflow: 'hidden',
              padding: 0,
              border: `2px solid ${
                hoveredIdx === i ? SPINLY_BRAND.border.accent : 'transparent'
              }`,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Slide ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
            />
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                right: 8,
                fontSize: 11,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'ui-monospace, monospace',
                background: 'rgba(0,0,0,0.5)',
                padding: '2px 6px',
                borderRadius: 4
              }}
            >
              {i + 1}/{urls.length}
            </div>
          </button>
        ))}
      </div>

      {lightboxUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de la slide"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            cursor: 'pointer'
          }}
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Aperçu"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxUrl(null)
            }}
            aria-label="Fermer la preview"
            style={{
              position: 'absolute',
              top: 16,
              right: 24,
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 32,
              cursor: 'pointer',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
