import { createClient } from '@supabase/supabase-js'
import { addDays, addMinutes, parseISO, set } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// Rebalance the pilot calendar around the per-type slot rotation:
//   carousel    → 08:00 Bogotá
//   single_post → 12:00 Bogotá
//   story       → 18:00 Bogotá
// ≤ 1 post per content_type per day, ≤ 3 posts/day. If a type has no draft for
// a given day, that slot stays empty (we never duplicate a type). Posts already
// published are left untouched. Surplus posts cascade forward to the next free
// (day, type-slot) pair.
//
// Usage:
//   tsx --env-file=.env.local scripts/rebalance-pilot-calendar.ts            # apply
//   tsx --env-file=.env.local scripts/rebalance-pilot-calendar.ts --dry-run  # preview

const TZ = 'America/Bogota'

type ContentType = 'carousel' | 'single_post' | 'story'

const TYPE_SLOTS: Record<ContentType, string> = {
  carousel: '08:00',
  single_post: '12:00',
  story: '18:00'
}
const MIN_LEAD_MINUTES = 30
// Wider than the scheduler's 7-day horizon: a large overflow may need weeks
// of room to land.
const HORIZON_DAYS = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Post {
  id: string
  content_type: ContentType | null
  pilot_scheduled_at: string
  pilot_published_at: string | null
  pe_status: string | null
  pe_post_id: string | null
  status: string | null
}

function bogotaDayKey(d: Date): string {
  const z = toZonedTime(d, TZ)
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, '0')}-${String(
    z.getDate()
  ).padStart(2, '0')}`
}

function utcForSlot(day: Date, slotStr: string): Date {
  const [h, m] = slotStr.split(':').map(Number)
  const z = toZonedTime(day, TZ)
  const slot = set(z, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
  return fromZonedTime(slot, TZ)
}

function isPublished(p: Post): boolean {
  return (
    !!p.pilot_published_at ||
    p.pe_status === 'published' ||
    p.status === 'published'
  )
}

function typeOf(p: Post): ContentType {
  return (p.content_type ?? 'carousel') as ContentType
}

function formatBogota(d: Date): string {
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  })
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const now = new Date()
  const minLead = addMinutes(now, MIN_LEAD_MINUTES)

  const { data: allPosts, error } = await supabase
    .from('ig_posts')
    .select(
      'id, content_type, pilot_scheduled_at, pilot_published_at, pe_status, pe_post_id, status'
    )
    .not('pilot_scheduled_at', 'is', null)
    .order('pilot_scheduled_at', { ascending: true })

  if (error) throw new Error(`Fetch failed: ${error.message}`)

  const posts = (allPosts ?? []) as Post[]
  const published = posts.filter(isPublished)
  const unpublished = posts.filter((p) => !isPublished(p))

  console.log(
    `Found ${posts.length} scheduled posts: ${published.length} published (locked), ${unpublished.length} pending\n`
  )

  // typeUsed = (day, contentType) pairs that are already occupied. Pre-seeded
  // with published posts so we never collide with history. An unpublished post
  // can only land on a (day, type) pair not in this set.
  const typeUsed = new Set<string>()
  const typeKey = (dayKey: string, t: ContentType) => `${dayKey}#${t}`

  for (const p of published) {
    const d = parseISO(p.pilot_scheduled_at)
    typeUsed.add(typeKey(bogotaDayKey(d), typeOf(p)))
  }

  // Group unpublished by their original Bogotá day, sorted within each day.
  const byDay = new Map<string, Post[]>()
  for (const p of unpublished) {
    const dayKey = bogotaDayKey(parseISO(p.pilot_scheduled_at))
    const arr = byDay.get(dayKey) ?? []
    arr.push(p)
    byDay.set(dayKey, arr)
  }
  Array.from(byDay.values()).forEach((arr) => {
    arr.sort(
      (a, b) =>
        new Date(a.pilot_scheduled_at).getTime() -
        new Date(b.pilot_scheduled_at).getTime()
    )
  })

  interface Assignment {
    id: string
    from: string
    to: string
    originalDayKey: string
    movedDays: boolean
    contentType: ContentType
    pe_post_id: string | null
  }
  const plan: Assignment[] = []
  const overflow: { post: Post; originalDayKey: string }[] = []

  // PASS 1 — keep each post on its original day if its type slot is free; else
  // spill into the overflow queue for cascade placement.
  const sortedDayKeys = Array.from(byDay.keys()).sort()
  for (const dayKey of sortedDayKeys) {
    const dayPosts = byDay.get(dayKey)!
    const dayDate = parseISO(dayPosts[0].pilot_scheduled_at)

    for (const post of dayPosts) {
      const ct = typeOf(post)
      const key = typeKey(dayKey, ct)
      if (typeUsed.has(key)) {
        overflow.push({ post, originalDayKey: dayKey })
        continue
      }
      const slotUtc = utcForSlot(dayDate, TYPE_SLOTS[ct])
      if (slotUtc < minLead) {
        overflow.push({ post, originalDayKey: dayKey })
        continue
      }
      typeUsed.add(key)
      plan.push({
        id: post.id,
        from: post.pilot_scheduled_at,
        to: slotUtc.toISOString(),
        originalDayKey: dayKey,
        movedDays: false,
        contentType: ct,
        pe_post_id: post.pe_post_id
      })
    }
  }

  // PASS 2 — cascade overflow forward, preserving content_type. Each post lands
  // on the nearest future day where its (day, type) slot is still free.
  overflow.sort(
    (a, b) =>
      new Date(a.post.pilot_scheduled_at).getTime() -
      new Date(b.post.pilot_scheduled_at).getTime()
  )

  for (const { post, originalDayKey } of overflow) {
    const ct = typeOf(post)
    // Anchor at noon UTC of the original day so addDays() stays inside the
    // intended calendar day under any DST/offset edge.
    const anchor = parseISO(`${originalDayKey}T12:00:00Z`)
    let assigned: Date | null = null
    let assignedDayKey = ''
    for (let offset = 1; offset <= HORIZON_DAYS && !assigned; offset++) {
      const day = addDays(anchor, offset)
      const dayKey = bogotaDayKey(day)
      const key = typeKey(dayKey, ct)
      if (typeUsed.has(key)) continue
      const slotUtc = utcForSlot(day, TYPE_SLOTS[ct])
      if (slotUtc < minLead) continue
      assigned = slotUtc
      assignedDayKey = dayKey
      typeUsed.add(key)
    }
    if (!assigned) {
      console.error(
        `  ✗ ${post.id} (${ct}, originally ${originalDayKey}) — no free slot within ${HORIZON_DAYS} days`
      )
      continue
    }
    plan.push({
      id: post.id,
      from: post.pilot_scheduled_at,
      to: assigned.toISOString(),
      originalDayKey,
      movedDays: assignedDayKey !== originalDayKey,
      contentType: ct,
      pe_post_id: post.pe_post_id
    })
  }

  // Report.
  const changed = plan.filter((p) => p.from !== p.to)
  const moved = plan.filter((p) => p.movedDays)
  const peSent = changed.filter((p) => !!p.pe_post_id)

  console.log(`Plan: ${plan.length} unpublished posts processed`)
  console.log(`  ${changed.length} will be rewritten`)
  console.log(`  ${moved.length} will move to a different day`)
  if (peSent.length > 0) {
    console.log(
      `  ⚠ ${peSent.length} already have pe_post_id — PostEverywhere holds the original schedule.`
    )
    console.log(
      `    DB will be updated but PE will NOT — reschedule those manually on PE.`
    )
  }
  console.log('')

  for (const p of plan.sort((a, b) => a.to.localeCompare(b.to))) {
    const fromStr = formatBogota(parseISO(p.from))
    const toStr = formatBogota(parseISO(p.to))
    const marker = p.from === p.to ? '·' : p.movedDays ? '⇒' : '→'
    const peTag = p.pe_post_id ? ' [PE]' : ''
    const typeTag = p.contentType.padEnd(11)
    console.log(
      `  ${marker} ${p.id.slice(0, 8)}  ${typeTag} ${fromStr}  →  ${toStr}${peTag}`
    )
  }

  if (dryRun) {
    console.log('\n(dry-run) no changes written. Re-run without --dry-run to apply.')
    return
  }
  if (changed.length === 0) {
    console.log('\nNothing to update.')
    return
  }

  console.log('\nApplying…')
  let ok = 0
  let fail = 0
  for (const p of changed) {
    const { error } = await supabase
      .from('ig_posts')
      .update({ pilot_scheduled_at: p.to })
      .eq('id', p.id)
    if (error) {
      console.error(`  ✗ ${p.id}: ${error.message}`)
      fail++
    } else {
      ok++
    }
  }
  console.log(`Done. ${ok} updated, ${fail} failed.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
