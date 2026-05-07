'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  postId: string
  peStatus: string | null
}

const POLL_INTERVAL_MS = 15_000
const MAX_ATTEMPTS = 8 // 8 × 15s = 2 min
const ACTIVE_STATUSES = new Set(['queued', 'publishing'])
const TERMINAL_STATUSES = new Set(['published', 'partial', 'failed'])

// Pure side-effect component. When the parent post is in an "active" PE state
// (queued / publishing), poll /api/ig/check-pe-status every 15s up to 8 times,
// then call router.refresh() if the status changed so the UI re-renders with
// the new pe_status / destinations / permalinks.
export default function PublishStatusTracker({ postId, peStatus }: Props) {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!peStatus || !ACTIVE_STATUSES.has(peStatus)) return

    let cancelled = false
    let attempts = 0

    async function poll() {
      if (cancelled) return
      attempts++
      try {
        const res = await fetch('/api/ig/check-pe-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        })
        if (cancelled) return
        const data = await res.json().catch(() => ({}))
        if (data?.ok) {
          const newStatus = data.pe_status as string | undefined
          if (newStatus && newStatus !== peStatus) {
            // Status changed — refresh server component to pick up new state.
            router.refresh()
            if (newStatus && TERMINAL_STATUSES.has(newStatus)) return
          }
        }
      } catch {
        // network/transient — keep trying within budget
      }

      if (attempts < MAX_ATTEMPTS && !cancelled) {
        timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [postId, peStatus, router])

  return null
}
