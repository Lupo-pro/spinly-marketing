import Link from 'next/link'
import { SPINLY_BRAND } from '../_styles/brand'

export interface CalendarPost {
  id: string
  content_type: 'carousel' | 'single_post' | 'story' | null
  caption: string
  pilot_scheduled_at: string
  pilot_platforms: string[] | null
  pe_status: string | null
  slide_image_urls: string[] | null
}

interface DayBucket {
  iso: string // YYYY-MM-DD in Bogotá calendar
  label: string
  isToday: boolean
  posts: CalendarPost[]
}

const TZ = 'America/Bogota'

function bogotaParts(d: Date): { y: number; m: number; day: number; h: number; min: number; weekday: string } {
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
    hour12: false
  })
  const parts = fmt.formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    day: Number(get('day')),
    h: Number(get('hour')),
    min: Number(get('minute')),
    weekday: get('weekday')
  }
}

function bogotaDateKey(d: Date): string {
  const p = bogotaParts(d)
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

function bogotaDateLabel(d: Date): string {
  const p = bogotaParts(d)
  return `${p.weekday.charAt(0).toUpperCase()}${p.weekday.slice(1)} ${p.day} ${monthName(p.m)}`
}

function monthName(m: number): string {
  return [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.'
  ][m - 1]
}

function bogotaTimeLabel(d: Date): string {
  const p = bogotaParts(d)
  return `${String(p.h).padStart(2, '0')}:${String(p.min).padStart(2, '0')}`
}

function buildBuckets(posts: CalendarPost[], horizonDays: number): DayBucket[] {
  const today = new Date()
  const todayKey = bogotaDateKey(today)
  const buckets: DayBucket[] = []
  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(today.getTime() + i * 86_400_000)
    const key = bogotaDateKey(d)
    buckets.push({ iso: key, label: bogotaDateLabel(d), isToday: key === todayKey, posts: [] })
  }
  for (const post of posts) {
    const d = new Date(post.pilot_scheduled_at)
    const key = bogotaDateKey(d)
    const bucket = buckets.find((b) => b.iso === key)
    if (bucket) bucket.posts.push(post)
  }
  // Sort each day by time.
  for (const b of buckets) {
    b.posts.sort(
      (a, c) => new Date(a.pilot_scheduled_at).getTime() - new Date(c.pilot_scheduled_at).getTime()
    )
  }
  return buckets
}

function PostCardMini({ post }: { post: CalendarPost }) {
  const ctype = (post.content_type ?? 'carousel') as keyof typeof SPINLY_BRAND.contentType
  const meta = SPINLY_BRAND.contentType[ctype]
  const time = bogotaTimeLabel(new Date(post.pilot_scheduled_at))
  const firstUrl = Array.isArray(post.slide_image_urls) ? post.slide_image_urls[0] : null
  const peStatus = post.pe_status as keyof typeof SPINLY_BRAND.status | null
  const peBadge = peStatus && SPINLY_BRAND.status[peStatus] ? SPINLY_BRAND.status[peStatus] : null

  let borderColor: string = SPINLY_BRAND.border.default
  if (post.pe_status === 'published') borderColor = 'rgba(74, 222, 128, 0.3)'
  else if (post.pe_status === 'failed' || post.pe_status === 'partial')
    borderColor = 'rgba(239, 68, 68, 0.3)'
  else if (post.pe_status === 'scheduled') borderColor = 'rgba(96, 165, 250, 0.3)'

  return (
    <Link
      href={`/admin/instagram/${post.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          background: SPINLY_BRAND.bg.surface,
          border: `1px solid ${borderColor}`,
          borderRadius: 10,
          padding: 10,
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}
      >
        <div
          style={{
            width: 48,
            height: 60,
            borderRadius: 6,
            overflow: 'hidden',
            background: '#000',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {firstUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={firstUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 18 }}>{meta.icon}</span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, color: SPINLY_BRAND.text.secondary, fontWeight: 600 }}>
            {time}
          </div>
          <div
            style={{
              fontSize: 12,
              color: SPINLY_BRAND.text.primary,
              fontWeight: 500,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {post.caption?.split('\n')[0] ?? 'Sans titre'}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 9,
                background: meta.bg,
                color: meta.fg,
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 700,
                letterSpacing: 0.3
              }}
            >
              {meta.icon}
            </span>
            {peBadge && (
              <span
                style={{
                  fontSize: 9,
                  background: peBadge.bg,
                  color: peBadge.fg,
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontWeight: 600
                }}
              >
                {peBadge.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function CalendarView({
  posts,
  horizonDays
}: {
  posts: CalendarPost[]
  horizonDays: number
}) {
  const buckets = buildBuckets(posts, horizonDays)

  return (
    <div
      className="spinly-calendar-grid"
      style={{
        gridTemplateColumns: `repeat(${horizonDays}, minmax(180px, 1fr))`,
        overflowX: 'auto',
        paddingBottom: 8
      }}
    >
      {buckets.map((b) => (
        <div
          key={b.iso}
          className="spinly-calendar-day"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${b.isToday ? SPINLY_BRAND.border.accent : SPINLY_BRAND.border.default}`,
            borderRadius: 12,
            padding: 12,
            minHeight: 200
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              color: b.isToday ? '#F59E2C' : SPINLY_BRAND.text.secondary,
              textTransform: 'uppercase',
              marginBottom: 10,
              paddingBottom: 8,
              borderBottom: `1px solid ${SPINLY_BRAND.border.default}`
            }}
          >
            {b.isToday ? "Aujourd'hui · " : ''}
            {b.label}
            <span
              style={{
                fontSize: 10,
                marginLeft: 6,
                color: SPINLY_BRAND.text.tertiary,
                fontWeight: 500,
                letterSpacing: 0
              }}
            >
              ({b.posts.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {b.posts.length === 0 ? (
              <div style={{ fontSize: 11, color: SPINLY_BRAND.text.tertiary, fontStyle: 'italic' }}>
                vide
              </div>
            ) : (
              b.posts.map((p) => <PostCardMini key={p.id} post={p} />)
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
