'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Slide } from '@/lib/instagram/generator'
import { SPINLY_BRAND } from '../_styles/brand'
import { StatusPill, type StatusKind } from './ui/StatusPill'

// Defensive: slide_image_urls is meant to be string[], but Supabase JSONB has
// surprised before (string-encoded JSON, null, etc). Accept the 3 shapes.
function asStringArray(urls: unknown): string[] {
  if (!urls) return []
  if (Array.isArray(urls)) return urls.filter((u) => typeof u === 'string') as string[]
  if (typeof urls === 'string') {
    try {
      const parsed = JSON.parse(urls)
      return Array.isArray(parsed) ? (parsed as string[]) : []
    } catch {
      return []
    }
  }
  return []
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60_000)
  if (min < 60) return `${min}min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}j`
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
  pe_status?: string | null
  pe_scheduled_for?: string | null
  caption?: string | null
}

function Badge({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: bg,
        color: fg,
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.3
      }}
    >
      {label}
    </span>
  )
}

export default function PostCard({ post }: { post: PostCardData }) {
  const [hovered, setHovered] = useState(false)
  const contentType = (post.content_type ?? 'carousel') as 'carousel' | 'single_post' | 'story'
  const ctype = SPINLY_BRAND.contentType[contentType] ?? SPINLY_BRAND.contentType.carousel

  const slideUrls = asStringArray(post.slide_image_urls)
  const firstImage = slideUrls[0]
  const totalSlides = slideUrls.length

  const firstSlide = post.slides_json?.[0]
  const hook =
    (firstSlide?.type === 'hook' ? firstSlide.title : null) ||
    post.caption?.split('\n')[0] ||
    'Sans titre'

  // Border color reflects PE state (visual hint for at-a-glance scanning).
  let borderColor: string = SPINLY_BRAND.border.default
  if (post.pe_status === 'published') borderColor = 'rgba(74, 222, 128, 0.3)'
  else if (post.pe_status === 'scheduled') borderColor = 'rgba(96, 165, 250, 0.3)'
  else if (post.pe_status === 'failed' || post.pe_status === 'partial')
    borderColor = 'rgba(239, 68, 68, 0.3)'

  const aspectRatio = contentType === 'story' ? '9 / 16' : '4 / 5'

  const status = post.status as StatusKind | undefined
  const statusValid = status && status in SPINLY_BRAND.status
  const peStatus = post.pe_status as StatusKind | undefined
  const peValid = peStatus && peStatus in SPINLY_BRAND.status

  return (
    <Link
      href={`/admin/instagram/${post.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: hovered ? SPINLY_BRAND.bg.surfaceHover : SPINLY_BRAND.bg.surface,
          border: `1px solid ${borderColor}`,
          borderRadius: 14,
          padding: 14,
          cursor: 'pointer',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.2s'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10
          }}
        >
          <Badge bg={ctype.bg} fg={ctype.fg} label={`${ctype.icon} ${ctype.label.toUpperCase()}`} />
          <span style={{ fontSize: 11, color: SPINLY_BRAND.text.tertiary }}>
            {timeAgo(post.generated_at)}
          </span>
        </div>

        <div
          style={{
            background: '#000',
            borderRadius: 10,
            aspectRatio,
            marginBottom: 12,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {firstImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={firstImage}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                color: SPINLY_BRAND.text.tertiary,
                fontSize: 12,
                padding: 20,
                textAlign: 'center'
              }}
            >
              ⏳ Pas encore rendu
            </div>
          )}
          {totalSlides > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 10,
                fontSize: 10,
                color: 'rgba(255,255,255,0.85)',
                background: 'rgba(0,0,0,0.5)',
                padding: '2px 6px',
                borderRadius: 4
              }}
            >
              1/{totalSlides}
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.35,
            marginBottom: 10,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: SPINLY_BRAND.text.primary
          }}
        >
          {hook.replace(/\*([^*]+)\*/g, '$1')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {statusValid && status && <StatusPill status={status} />}
          {peValid && peStatus && <StatusPill status={peStatus} />}
          {post.pe_status === 'scheduled' && post.pe_scheduled_for && (
            <span style={{ fontSize: 10, color: SPINLY_BRAND.text.secondary }}>
              ·{' '}
              {new Date(post.pe_scheduled_for).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
