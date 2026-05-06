'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { renderPostAction } from '../actions'

export default function RenderButton({
  postId,
  hasUrls
}: {
  postId: string
  hasUrls: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleClick() {
    setError('')
    startTransition(async () => {
      try {
        const result = await renderPostAction(postId)
        if (result.errors && result.errors.length > 0) {
          setError(`${result.errors.length} slide(s) ont échoué`)
        }
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="px-4 py-2 bg-amber-500 text-zinc-950 rounded-lg text-sm font-medium hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        {isPending ? 'Rendu en cours…' : hasUrls ? 'Re-render slides' : 'Render slides'}
      </button>
      {error && <p className="text-rose-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
