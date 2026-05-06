'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { schedulePostAction } from '../actions'

export default function ScheduleButton({
  postId,
  status,
  hasRendered,
  scheduledFor
}: {
  postId: string
  status: string
  hasRendered: boolean
  scheduledFor?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Already scheduled or further in lifecycle — just show the slot.
  if (status === 'scheduled' && scheduledFor) {
    const d = new Date(scheduledFor)
    return (
      <div className="text-sm text-sky-300">
        Programmé pour le {d.toLocaleDateString('fr-FR')} à{' '}
        {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    )
  }
  if (status === 'published' || status === 'failed') {
    return null
  }

  if (status !== 'approved' || !hasRendered) {
    return (
      <div className="text-zinc-500 text-sm">
        Approuve + rends les visuels pour pouvoir programmer la publication.
      </div>
    )
  }

  function handleClick() {
    setResult(null)
    setError(null)
    startTransition(async () => {
      const r = await schedulePostAction(postId)
      if (r.ok && r.scheduledFor) {
        const d = new Date(r.scheduledFor)
        setResult(
          `Programmé pour le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}`
        )
        router.refresh()
      } else {
        setError(r.error || 'Erreur inconnue')
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 disabled:opacity-30 rounded-lg text-white font-medium transition"
      >
        {isPending ? 'Programmation…' : 'Programmer la publication'}
      </button>
      {result && <p className="text-sm mt-2 text-emerald-300">{result}</p>}
      {error && <p className="text-sm mt-2 text-rose-400">{error}</p>}
    </div>
  )
}
