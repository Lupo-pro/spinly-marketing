'use client'

import { useState } from 'react'

interface Props {
  caption: string
  hashtags: string[]
}

type CopyTarget = 'caption' | 'hashtags' | 'full'

export default function CaptionBlock({ caption, hashtags }: Props) {
  const [copied, setCopied] = useState<CopyTarget | null>(null)

  const captionFull =
    caption + (hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : '')

  async function copyText(text: string, what: CopyTarget) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for non-HTTPS / older browsers
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
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Caption + hashtags
          </h3>
          <button
            type="button"
            onClick={() => copyText(captionFull, 'full')}
            className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 rounded text-white text-sm font-medium transition"
          >
            {copied === 'full' ? '✓ Copié' : 'Copier tout'}
          </button>
        </div>
        <pre className="text-zinc-300 text-sm whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
          {captionFull}
        </pre>
        <div className="mt-3 text-xs text-zinc-500">
          {captionFull.length} caractères · {hashtags.length} hashtags
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => copyText(caption, 'caption')}
          className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 text-sm font-medium transition"
        >
          {copied === 'caption' ? '✓ Caption copiée' : 'Copier caption seule'}
        </button>
        <button
          type="button"
          onClick={() => copyText(hashtags.join(' '), 'hashtags')}
          className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 text-sm font-medium transition"
        >
          {copied === 'hashtags' ? '✓ Hashtags copiés' : 'Copier hashtags seuls'}
        </button>
      </div>
    </div>
  )
}
