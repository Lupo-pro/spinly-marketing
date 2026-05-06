'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approvePost, rejectPost, regeneratePost } from '../../actions'

export default function PostActions({
  postId,
  status
}: {
  postId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const canApprove = status === 'draft'

  function handleApprove() {
    startTransition(async () => {
      await approvePost(postId)
      router.refresh()
    })
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) return
    const fd = new FormData()
    fd.set('reason', reason)
    startTransition(async () => {
      await rejectPost(postId, fd)
    })
  }

  function handleRegenerate() {
    if (!confirm('Régénérer ce carrousel ? Le contenu actuel sera écrasé.')) return
    startTransition(async () => {
      await regeneratePost(postId)
      router.refresh()
    })
  }

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending || !canApprove}
          className="px-4 py-2 bg-emerald-500 text-zinc-950 rounded-lg text-sm font-medium hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          {pending ? '...' : 'Approuver'}
        </button>

        <button
          type="button"
          onClick={() => setShowReject((v) => !v)}
          disabled={pending}
          className="px-4 py-2 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-lg text-sm font-medium hover:bg-rose-500/25 disabled:opacity-30 transition"
        >
          Rejeter
        </button>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={pending}
          className="px-4 py-2 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-30 transition"
        >
          {pending ? 'Régénération...' : 'Régénérer (Claude)'}
        </button>
      </div>

      {showReject && (
        <form onSubmit={handleReject} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Raison du rejet..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-600"
          />
          <button
            type="submit"
            disabled={pending || !reason.trim()}
            className="px-4 py-2 bg-rose-500 text-zinc-950 rounded-lg text-sm font-medium hover:bg-rose-400 disabled:opacity-30 transition"
          >
            Confirmer
          </button>
        </form>
      )}
    </section>
  )
}
