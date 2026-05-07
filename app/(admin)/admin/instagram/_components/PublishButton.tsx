'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const ALL_PLATFORMS: { key: string; label: string }[] = [
  { key: 'instagram', label: '📷 Instagram' },
  { key: 'facebook', label: '👥 Facebook' },
  { key: 'threads', label: '🧵 Threads' },
  { key: 'tiktok', label: '🎵 TikTok' },
  { key: 'linkedin', label: '💼 LinkedIn' },
  { key: 'x', label: '🐦 X' }
]

interface Props {
  postId: string
  status: string
  contentType: 'carousel' | 'single_post' | 'story'
  hasRendered: boolean
  peStatus: string | null
  peScheduledFor: string | null
  peError: string | null
  peDestinations: { platform: string; status: string; permalink?: string }[] | null
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  queued: { label: '⏳ En attente', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  scheduled: { label: '📅 Programmé', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  publishing: { label: '🔄 Publication…', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  published: { label: '✅ Publié', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  partial: { label: '⚠️ Partiel', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  failed: { label: '❌ Échec', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' }
}

export default function PublishButton({
  postId,
  status,
  contentType,
  hasRendered,
  peStatus,
  peScheduledFor,
  peError,
  peDestinations
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [platforms, setPlatforms] = useState<string[]>(
    contentType === 'story' ? ['instagram'] : ['instagram', 'facebook']
  )
  const [scheduledLocal, setScheduledLocal] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Already in a "done or in flight" state — show status, no publish button
  if (peStatus === 'published' || peStatus === 'partial') {
    const badge = STATUS_BADGE[peStatus]
    return (
      <div className="space-y-2">
        <span className={`text-xs px-2 py-1 rounded border ${badge.cls}`}>{badge.label}</span>
        {peDestinations && peDestinations.length > 0 && (
          <ul className="text-xs text-zinc-400 space-y-1">
            {peDestinations.map((d, i) => (
              <li key={i}>
                {d.platform} —{' '}
                {d.permalink ? (
                  <a
                    href={d.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-zinc-200"
                  >
                    {d.status}
                  </a>
                ) : (
                  <span>{d.status}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <RefreshStatusButton postId={postId} />
      </div>
    )
  }

  if (peStatus === 'scheduled' && peScheduledFor) {
    const badge = STATUS_BADGE.scheduled
    const d = new Date(peScheduledFor)
    return (
      <div className="space-y-2">
        <span className={`text-xs px-2 py-1 rounded border ${badge.cls}`}>{badge.label}</span>
        <p className="text-sm text-zinc-300">
          Pour le {d.toLocaleDateString('fr-FR')} à{' '}
          {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <RefreshStatusButton postId={postId} />
      </div>
    )
  }

  if (peStatus === 'queued' || peStatus === 'publishing') {
    const badge = STATUS_BADGE[peStatus]
    return (
      <div className="space-y-2">
        <span className={`text-xs px-2 py-1 rounded border ${badge.cls}`}>{badge.label}</span>
        <RefreshStatusButton postId={postId} />
      </div>
    )
  }

  // No published state yet — show publish button (or gate with reasons)
  if (status !== 'approved') {
    return <p className="text-sm text-zinc-500">Approuve le post avant de publier.</p>
  }
  if (!hasRendered) {
    return <p className="text-sm text-zinc-500">Render les visuels avant de publier.</p>
  }

  function publish() {
    setError(null)
    // Convert local datetime-local input to UTC ISO for the API
    let scheduledFor: string | undefined
    if (scheduledLocal) {
      const d = new Date(scheduledLocal)
      if (Number.isNaN(d.getTime())) {
        setError('Date invalide')
        return
      }
      scheduledFor = d.toISOString()
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/ig/publish-pe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, platforms, scheduledFor })
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || `HTTP ${res.status}`)
          return
        }
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      }
    })
  }

  return (
    <div className="space-y-3">
      {peStatus === 'failed' && peError && (
        <div className="text-xs px-3 py-2 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300">
          ❌ Échec précédent : {peError}
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 rounded-lg text-white font-medium transition"
        >
          🚀 Publier sur les réseaux
        </button>
      ) : (
        <div className="border border-zinc-800 rounded-lg p-4 space-y-4 bg-zinc-900/40">
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Plateformes
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer text-sm px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-600 bg-zinc-950"
                >
                  <input
                    type="checkbox"
                    checked={platforms.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) setPlatforms([...platforms, key])
                      else setPlatforms(platforms.filter((p) => p !== key))
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Coches uniquement les plateformes connectées dans PostEverywhere.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Programmer (optionnel)
            </label>
            <input
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Vide = publier maintenant.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={publish}
              disabled={isPending || platforms.length === 0}
              className="px-4 py-2 bg-emerald-500 text-zinc-950 rounded-lg text-sm font-medium hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              {isPending
                ? 'Envoi…'
                : scheduledLocal
                  ? '📅 Programmer'
                  : '🚀 Publier maintenant'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setError(null)
              }}
              disabled={isPending}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm font-medium transition"
            >
              Annuler
            </button>
          </div>

          {error && <p className="text-rose-400 text-sm">❌ {error}</p>}
        </div>
      )}
    </div>
  )
}

function RefreshStatusButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/ig/check-pe-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId })
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || `HTTP ${res.status}`)
          return
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={refresh}
        disabled={isPending}
        className="text-xs text-zinc-400 hover:text-zinc-200 underline disabled:opacity-50"
      >
        {isPending ? 'Refresh…' : 'Refresh status'}
      </button>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  )
}
