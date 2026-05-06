'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAsPublishedAction, unmarkAsPublishedAction } from '../actions'

interface Props {
  postId: string
  status: string
  igPermalink?: string | null
  hasRendered: boolean
}

export default function MarkPublishedButton({
  postId,
  status,
  igPermalink,
  hasRendered
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [permalink, setPermalink] = useState(igPermalink || '')
  const [showInput, setShowInput] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'published') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium">
            ✓ Publié
          </span>
          {igPermalink && (
            <a
              href={igPermalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-zinc-200 underline"
            >
              Voir sur Instagram →
            </a>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!confirm('Annuler le marquage "publié" ? Le post repassera en "approved".')) return
            startTransition(async () => {
              const r = await unmarkAsPublishedAction(postId)
              if (!r.ok) setError(r.error)
              router.refresh()
            })
          }}
          disabled={isPending}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline"
        >
          Annuler le marquage
        </button>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    )
  }

  if (status !== 'approved' || !hasRendered) {
    return (
      <p className="text-sm text-zinc-500">
        Le post doit être approuvé et avoir ses 10 slides rendues pour pouvoir être marqué publié.
      </p>
    )
  }

  function handleMarkPublished() {
    setError(null)
    startTransition(async () => {
      const result = await markAsPublishedAction(postId, permalink.trim() || undefined)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setShowInput(false)
      router.refresh()
    })
  }

  if (showInput) {
    return (
      <div className="space-y-2">
        <input
          type="url"
          placeholder="https://www.instagram.com/p/… (optionnel)"
          value={permalink}
          onChange={(e) => setPermalink(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 text-sm focus:outline-none focus:border-zinc-600"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMarkPublished}
            disabled={isPending}
            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded text-white text-sm font-medium transition"
          >
            {isPending ? 'Marquage…' : 'Confirmer "Publié"'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false)
              setError(null)
            }}
            disabled={isPending}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 text-sm font-medium transition"
          >
            Annuler
          </button>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <p className="text-xs text-zinc-500">
          Tu peux laisser le lien vide si tu n&apos;as pas encore l&apos;URL Instagram du post.
        </p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setShowInput(true)}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition"
    >
      Marquer comme publié manuellement
    </button>
  )
}
