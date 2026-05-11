import { createClient } from '@supabase/supabase-js'
import { addDays, addMinutes, parseISO, set } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// Rebalance the pilot calendar so every Bogotá day has ≤ 2 posts, scheduled at
// 08:00 and 12:00 Bogotá-local. Posts already published are left untouched.
// Surplus posts cascade forward to the next free (day, slot).
//
// Usage:
//   tsx --env-file=.env.local scripts/rebalance-pilot-calendar.ts            # apply
//   tsx --env-file=.env.local scripts/rebalance-pilot-calendar.ts --dry-run  # preview

const TZ = 'America/Bogota'
const SHARED_SLOTS = ['08:00', '12:00'] as const
const MAX_POSTS_PER_DAY = 2
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
    .select('id, pilot_scheduled_at, pilot_published_at, pe_status, pe_post_id, status')
    .not('pilot_scheduled_at', 'is', null)
    .order('pilot_scheduled_at', { ascending: true })

  if (error) throw new Error(`Fetch failed: ${error.message}`)

  const posts = (allPosts ?? []) as Post[]
  const published = posts.filter(isPublished)
  const unpublished = posts.filter((p) => !isPublished(p))

  console.log(
    `Found ${posts.length} scheduled posts: ${published.length} published (locked), ${unpublished.length} pending\n`
  )

  // dayCount = how many posts are anchored to a given Bogotá day (any time).
  // slotTaken = exact (day,slot) instants we've consumed and cannot reuse.
  // Both are pre-seeded with published posts so we never collide with history.
  const dayCount = new Map<string, number>()
  const slotTaken = new Set<string>()
  const bump = (dayKey: string) =>
    dayCount.set(dayKey, (dayCount.get(dayKey) ?? 0) + 1)

  for (const p of published) {
    const d = parseISO(p.pilot_scheduled_at)
    const dayKey = bogotaDayKey(d)
    bump(dayKey)
    const z = toZonedTime(d, TZ)
    const hh = String(z.getHours()).padStart(2, '0')
    const mm = String(z.getMinutes()).padStart(2, '0')
    const slotStr = `${hh}:${mm}`
    if ((SHARED_SLOTS as readonly string[]).includes(slotStr)) {
      slotTaken.add(`${dayKey}@${slotStr}`)
    }
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
    pe_post_id: string | null
  }
  const plan: Assignment[] = []
  const overflow: { post: Post; originalDayKey: string }[] = []

  // PASS 1 — keep up to MAX_POSTS_PER_DAY on their original day; spill the rest.
  const sortedDayKeys = Array.from(byDay.keys()).sort()
  for (const dayKey of sortedDayKeys) {
    const dayPosts = byDay.get(dayKey)!
    const dayDate = parseISO(dayPosts[0].pilot_scheduled_at)

    for (const post of dayPosts) {
      if ((dayCount.get(dayKey) ?? 0) >= MAX_POSTS_PER_DAY) {
        overflow.push({ post, originalDayKey: dayKey })
        continue
      }
      let assigned: Date | null = null
      for (const slotStr of SHARED_SLOTS) {
        const slotKey = `${dayKey}@${slotStr}`
        if (slotTaken.has(slotKey)) continue
        const slotUtc = utcForSlot(dayDate, slotStr)
        if (slotUtc < minLead) continue
        assigned = slotUtc
        slotTaken.add(slotKey)
        bump(dayKey)
        break
      }
      if (assigned) {
        plan.push({
          id: post.id,
          from: post.pilot_scheduled_at,
          to: assigned.toISOString(),
          originalDayKey: dayKey,
          movedDays: false,
          pe_post_id: post.pe_post_id
        })
      } else {
        // Original day fully past (or its slots already taken by published).
        // Push to next-available-day handling.
        overflow.push({ post, originalDayKey: dayKey })
      }
    }
  }

  // PASS 2 — cascade overflow forward in original chronological order.
  overflow.sort(
    (a, b) =>
      new Date(a.post.pilot_scheduled_at).getTime() -
      new Date(b.post.pilot_scheduled_at).getTime()
  )

  for (const { post, originalDayKey } of overflow) {
    // Anchor at noon UTC of the original day so addDays() stays inside the
    // intended calendar day under any DST/offset edge.
    const anchor = parseISO(`${originalDayKey}T12:00:00Z`)
    let assigned: Date | null = null
    for (let offset = 1; offset <= HORIZON_DAYS && !assigned; offset++) {
      const day = addDays(anchor, offset)
      const dayKey = bogotaDayKey(day)
      if ((dayCount.get(dayKey) ?? 0) >= MAX_POSTS_PER_DAY) continue
      for (const slotStr of SHARED_SLOTS) {
        const slotKey = `${dayKey}@${slotStr}`
        if (slotTaken.has(slotKey)) continue
        const slotUtc = utcForSlot(day, slotStr)
        if (slotUtc < minLead) continue
        assigned = slotUtc
        slotTaken.add(slotKey)
        bump(dayKey)
        break
      }
    }
    if (!assigned) {
      console.error(
        `  ✗ ${post.id} (originally ${originalDayKey}) — no free slot within ${HORIZON_DAYS} days`
      )
      continue
    }
    plan.push({
      id: post.id,
      from: post.pilot_scheduled_at,
      to: assigned.toISOString(),
      originalDayKey,
      movedDays: bogotaDayKey(assigned) !== originalDayKey,
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
    console.log(`  ${marker} ${p.id.slice(0, 8)}  ${fromStr}  →  ${toStr}${peTag}`)
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
