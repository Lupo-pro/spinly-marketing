'use client'

import { useState } from 'react'

interface Props {
  postId: string
  hasRendered: boolean
}

export default function DownloadZipButton({ postId, hasRendered }: Props) {
  const [downloading, setDownloading] = useState(false)

  if (!hasRendered) {
    return (
      <button
        type="button"
        disabled
        className="px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg font-medium cursor-not-allowed"
      >
        ZIP indisponible (slides non rendues)
      </button>
    )
  }

  function handleDownload() {
    setDownloading(true)
    // Native browser download — same-origin, cookies sent automatically.
    window.location.href = `/api/ig/download-zip/${postId}`
    setTimeout(() => setDownloading(false), 3000)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 disabled:opacity-50 rounded-lg text-white font-medium transition inline-flex items-center gap-2"
    >
      {downloading ? (
        <>
          <span className="animate-spin">⏳</span>
          Préparation du ZIP…
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
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
