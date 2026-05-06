'use client'

interface Props {
  url: string | null
  postId: string
  hasRendered: boolean
}

// Direct download of the single PNG. The Storage URL is already public so we
// don't need a server route — the browser handles `download` attribute on <a>.
export default function DownloadSinglePngButton({ url, postId, hasRendered }: Props) {
  if (!hasRendered || !url) {
    return (
      <button
        type="button"
        disabled
        className="px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg font-medium cursor-not-allowed"
      >
        PNG indisponible (slide non rendue)
      </button>
    )
  }

  return (
    <a
      href={url}
      download={`spinly-${postId.slice(0, 8)}.png`}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 rounded-lg text-white font-medium transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
