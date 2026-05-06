'use client'

import Link from 'next/link'
import type { Slide } from '@/lib/instagram/generator'

// Defensive: slide_image_urls is meant to be string[], but Supabase JSONB has
// surprised before (string-encoded JSON, null, etc). Accept the 3 shapes.
function getSlidesCount(urls: unknown): number {
  if (!urls) return 0
  if (Array.isArray(urls)) return urls.length
  if (typeof urls === 'string') {
    try {
      const parsed = JSON.parse(urls)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  }
  return 0
}

const AXIS_LABELS: Record<string, string> = {
  anti_agencias: 'Anti-agencias',
  google_algo: 'Google algo',
  pme_pain: 'PME pain',
  vendedor: 'Vendedor',
  social_proof: 'Social proof',
  gamification: 'Gamification',
  reseñas_strategy: 'Reseñas'
}

const AXIS_COLORS: Record<string, string> = {
  anti_agencias: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  google_algo: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  pme_pain: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  vendedor: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  social_proof: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  gamification: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  reseñas_strategy: 'bg-teal-500/15 text-teal-300 border-teal-500/30'
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diffSec < 60) return `${diffSec}s`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
  return `${Math.floor(diffSec / 86400)}j`
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

export type PostCardData = {
  id: string
  slides_json: Slide[]
  generated_at: string
  status?: string
  content_type?: 'carousel' | 'single_post' | 'story' | null
  slide_image_urls?: string[] | null
  published_at?: string | null
  ig_permalink?: string | null
  ig_angles: { axis: string } | null
}

export default function PostCard({ post }: { post: PostCardData }) {
  const firstSlide = post.slides_json?.[0]
  const hook = firstSlide?.type === 'hook' ? firstSlide.title : '(no hook)'
  const axis = post.ig_angles?.axis
  const badgeClass = axis ? AXIS_COLORS[axis] : 'bg-zinc-800 text-zinc-400 border-zinc-700'

  const slidesCount = getSlidesCount(post.slide_image_urls)
  const contentType = post.content_type ?? 'carousel'
  // Phase 10: a carousel is ready when 10 PNGs are rendered; a single_post needs 1.
  const expectedSlides = contentType === 'single_post' ? 1 : 10
  const hasRendered = slidesCount === expectedSlides
  const isApproved = post.status?.toLowerCase().trim() === 'approved'
  const isReady = isApproved && hasRendered

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[PostCard] ${post.id.slice(0, 8)} type=${contentType} status=${post.status} slides=${slidesCount}/${expectedSlides} ready=${isReady}`
    )
  }

  return (
    <Link
      href={`/admin/instagram/${post.id}`}
      className="block bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}
          >
            {axis ? AXIS_LABELS[axis] ?? axis : 'no axis'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            {contentType === 'single_post' ? '📷 Post' : '🎴 Carrousel'}
          </span>
        </div>
        <span className="text-xs text-zinc-500 shrink-0">{timeAgo(post.generated_at)}</span>
      </div>
      <p className="text-sm font-medium leading-snug">
        {hook.replace(/\*([^*]+)\*/g, '$1')}
      </p>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {isReady && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
            📦 Prêt
          </span>
        )}
        {post.status === 'published' && post.published_at && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            📅 Publié {shortDate(post.published_at)}
          </span>
        )}
        {post.status === 'published' && post.ig_permalink && (
          <a
            href={post.ig_permalink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
          >
            voir sur IG ↗
          </a>
        )}
      </div>
    </Link>
  )
}
