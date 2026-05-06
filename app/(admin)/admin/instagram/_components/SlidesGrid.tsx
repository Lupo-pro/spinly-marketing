'use client'

import { useState, useEffect } from 'react'

export default function SlidesGrid({ urls }: { urls: string[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

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
      <p className="text-zinc-500 text-sm">
        Aucune slide rendue. Clique sur « Render slides » pour générer les visuels.
      </p>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {urls.map((url, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setLightboxUrl(url)}
            className="relative aspect-[4/5] bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-zinc-600 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Slide ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-1 right-2 text-xs text-white/80 font-mono bg-black/40 px-1 rounded">
              {i + 1}/{urls.length}
            </div>
          </button>
        ))}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full" />
          <button
            type="button"
            className="absolute top-4 right-6 text-white/70 hover:text-white text-3xl"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
