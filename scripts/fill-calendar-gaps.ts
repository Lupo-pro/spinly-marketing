import { createClient } from '@supabase/supabase-js'
import { addDays, addMinutes, parseISO, set } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import {
  generateDraft,
  selectAnglesForGeneration,
  pickUnderusedTemplates
} from '@/lib/instagram/generator'

// Saturate the pilot calendar: every day in the horizon must hold exactly 3
// posts — 1 carousel (08:00) + 1 single_post (12:00) + 1 story (18:00),
// Bogotá time. Walks the horizon, finds (day, type) holes, then:
//   1) consumes unscheduled draft posts that already match a missing type;
//   2) calls Haiku to fill what's left. Each Haiku run yields a triple
//      (carousel + single_post + story); only the pieces still needed are
//      inserted, the rest is discarded to avoid creating ghosts.
//
// All new posts land as status='draft' with pilot_scheduled_at pre-set, so
// they enter the same validation flow as cron-generated drafts and the
// downstream rebalance script can lock them in.
//
// Usage:
//   tsx --env-file=.env.local scripts/fill-calendar-gaps.ts             # apply
//   tsx --env-file=.env.local scripts/fill-calendar-gaps.ts --dry-run   # preview
//   tsx --env-file=.env.local scripts/fill-calendar-gaps.ts --days=21   # extend horizon
//   tsx --env-file=.env.local scripts/fill-calendar-gaps.ts --max=12    # cap Haiku calls

const TZ = 'America/Bogota'
type ContentType = 'carousel' | 'single_post' | 'story'

const TYPE_SLOTS: Record<ContentType, string> = {
  carousel: '08:00',
  single_post: '12:00',
  story: '18:00'
}
const TYPES: ContentType[] = ['carousel', 'single_post', 'story']
const MIN_LEAD_MINUTES = 30
const DEFAULT_MIN_DAYS = 14
// Safety cap so a bad horizon argument doesn't spawn hundreds of Haiku calls.
const DEFAULT_MAX_RUNS = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

function bogotaDayKey(d: Date): string {
  const z = toZonedTime(d, TZ)
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, '0')}-${String(
    z.getDate()
  ).padStart(2, '0')}`
}

function utcForSlot(dayKey: string, slot: string): Date {
  // Anchor at noon UTC of the calendar day so addDays() / DST shifts can't
  // bump us into the wrong Bogotá day, then set the actual hour in Bogotá.
  const [y, mo, da] = dayKey.split('-').map(Number)
  const [h, m] = slot.split(':').map(Number)
  const anchorUtc = new Date(Date.UTC(y, mo - 1, da, 12, 0, 0))
  const zoned = toZonedTime(anchorUtc, TZ)
  const slotZoned = set(zoned, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
  return fromZonedTime(slotZoned, TZ)
}

function addDayKey(dayKey: string, n: number): string {
  const [y, mo, da] = dayKey.split('-').map(Number)
  const next = addDays(new Date(Date.UTC(y, mo - 1, da, 12, 0, 0)), n)
  return bogotaDayKey(next)
}

function arg(name: string): string | undefined {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`))
  return a?.split('=')[1]
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const minDays = Number(arg('days') ?? DEFAULT_MIN_DAYS)
  const maxRuns = Number(arg('max') ?? DEFAULT_MAX_RUNS)

  const now = new Date()
  const minLead = addMinutes(now, MIN_LEAD_MINUTES)

  const { data: scheduled, error: e1 } = await supabase
    .from('ig_posts')
    .select(
      'id, content_type, pilot_scheduled_at, pilot_published_at, pe_status, status'
    )
    .not('pilot_scheduled_at', 'is', null)
    .order('pilot_scheduled_at', { ascending: true })
  if (e1) throw new Error(`Fetch scheduled failed: ${e1.message}`)

  const { data: spareDrafts, error: e2 } = await supabase
    .from('ig_posts')
    .select('id, content_type, status, generated_at')
    .eq('status', 'draft')
    .is('pilot_scheduled_at', null)
    .order('generated_at', { ascending: true })
  if (e2) throw new Error(`Fetch spares failed: ${e2.message}`)

  // Horizon: [tomorrow Bogotá, max(today+minDays, latest scheduled day)].
  const startKey = bogotaDayKey(addDays(now, 1))
  const latestScheduledKey =
    scheduled && scheduled.length > 0
      ? bogotaDayKey(parseISO(scheduled[scheduled.length - 1].pilot_scheduled_at!))
      : startKey
  const minEndKey = bogotaDayKey(addDays(now, minDays))
  const endKey = latestScheduledKey > minEndKey ? latestScheduledKey : minEndKey

  const occupied = new Set<string>() // `${day}#${type}`
  for (const p of scheduled ?? []) {
    const d = parseISO(p.pilot_scheduled_at!)
    const ct = (p.content_type ?? 'carousel') as ContentType
    occupied.add(`${bogotaDayKey(d)}#${ct}`)
  }

  const days: string[] = []
  for (let k = startKey; k <= endKey; k = addDayKey(k, 1)) days.push(k)

  const gaps: { day: string; type: ContentType; slot: Date }[] = []
  for (const day of days) {
    for (const t of TYPES) {
      if (occupied.has(`${day}#${t}`)) continue
      const slot = utcForSlot(day, TYPE_SLOTS[t])
      if (slot < minLead) continue
      gaps.push({ day, type: t, slot })
    }
  }

  console.log(`Horizon: ${startKey} → ${endKey} (${days.length} days)`)
  console.log(`Gaps detected: ${gaps.length}`)
  const gapsByType = TYPES.reduce(
    (acc, t) => {
      acc[t] = gaps.filter((g) => g.type === t).length
      return acc
    },
    { carousel: 0, single_post: 0, story: 0 } as Record<ContentType, number>
  )
  console.log(
    `  carousel: ${gapsByType.carousel}  single_post: ${gapsByType.single_post}  story: ${gapsByType.story}`
  )
  console.log(`Spare unscheduled drafts: ${spareDrafts?.length ?? 0}`)
  console.log('')

  if (gaps.length === 0) {
    console.log('No gaps. Calendar already saturated.')
    return
  }

  // PHASE 1 — map spare drafts to matching-type gaps (no Haiku call needed).
  const sparesByType: Record<ContentType, string[]> = {
    carousel: [],
    single_post: [],
    story: []
  }
  for (const s of spareDrafts ?? []) {
    const ct = (s.content_type ?? 'carousel') as ContentType
    if (TYPES.includes(ct)) sparesByType[ct].push(s.id)
  }

  const spareAssignments: { postId: string; gap: (typeof gaps)[number] }[] = []
  const remainingGaps: typeof gaps = []
  for (const gap of gaps) {
    const pool = sparesByType[gap.type]
    if (pool.length > 0) {
      spareAssignments.push({ postId: pool.shift()!, gap })
    } else {
      remainingGaps.push(gap)
    }
  }

  // PHASE 2 — generate triples to cover the rest. Each Haiku call produces
  // one carousel + one single_post + one story, so the run count is the max
  // of the three per-type remaining counts.
  const remainingByType: Record<ContentType, typeof gaps> = {
    carousel: remainingGaps.filter((g) => g.type === 'carousel'),
    single_post: remainingGaps.filter((g) => g.type === 'single_post'),
    story: remainingGaps.filter((g) => g.type === 'story')
  }
  const wantedRuns = Math.max(
    remainingByType.carousel.length,
    remainingByType.single_post.length,
    remainingByType.story.length
  )
  const runs = Math.min(wantedRuns, maxRuns)

  console.log(`Phase 1: ${spareAssignments.length} spare drafts will fill matching gaps`)
  console.log(`Phase 2: ${remainingGaps.length} gaps need Haiku — ${runs} generation(s)${
    runs < wantedRuns ? ` (capped from ${wantedRuns}, raise with --max=N)` : ''
  }`)
  console.log('')

  if (dryRun) {
    for (const a of spareAssignments) {
      console.log(
        `  · ${a.gap.type.padEnd(11)} ${a.gap.day} ${TYPE_SLOTS[a.gap.type]} (spare ${a.postId.slice(0, 8)})`
      )
    }
    for (const t of TYPES) {
      for (const g of remainingByType[t]) {
        console.log(`  + ${t.padEnd(11)} ${g.day} ${TYPE_SLOTS[t]} (to generate)`)
      }
    }
    console.log('\n(dry-run) no DB writes, no Haiku calls.')
    return
  }

  // Apply phase 1 assignments.
  let spareOk = 0
  for (const a of spareAssignments) {
    const { error } = await supabase
      .from('ig_posts')
      .update({ pilot_scheduled_at: a.gap.slot.toISOString() })
      .eq('id', a.postId)
    if (error) {
      console.error(`  ✗ spare ${a.postId.slice(0, 8)}: ${error.message}`)
    } else {
      console.log(
        `  · ${a.gap.type.padEnd(11)} ${a.gap.day} ${TYPE_SLOTS[a.gap.type]} (spare ${a.postId.slice(0, 8)})`
      )
      spareOk++
    }
  }

  // Apply phase 2 generations.
  let angles: Awaited<ReturnType<typeof selectAnglesForGeneration>> = []
  if (runs > 0) {
    angles = await selectAnglesForGeneration(runs)
    if (angles.length === 0) {
      console.error('  ✗ no angles available — cannot fill remaining gaps')
    }
  }

  let inserted = 0
  for (let i = 0; i < runs; i++) {
    const angle = angles[i % Math.max(angles.length, 1)]
    if (!angle) break
    try {
      const { singlePostType, storyType } = await pickUnderusedTemplates(angle.axis)
      const draft = await generateDraft(
        { axis: angle.axis, hook: angle.hook, thesis: angle.thesis },
        { preferSinglePostType: singlePostType, preferStoryType: storyType }
      )

      const pieces: { type: ContentType; slidesJson: unknown }[] = []
      if (remainingByType.carousel.length > 0) {
        pieces.push({ type: 'carousel', slidesJson: draft.carousel.slides })
      }
      if (remainingByType.single_post.length > 0 && draft.single_post) {
        pieces.push({ type: 'single_post', slidesJson: [{ n: 1, ...draft.single_post }] })
      }
      if (remainingByType.story.length > 0 && draft.story) {
        pieces.push({ type: 'story', slidesJson: [{ n: 1, ...draft.story }] })
      }

      for (const piece of pieces) {
        const gap = remainingByType[piece.type].shift()
        if (!gap) continue
        const { data: ins, error: insErr } = await supabase
          .from('ig_posts')
          .insert({
            angle_id: angle.id,
            status: 'draft',
            content_type: piece.type,
            slides_json: piece.slidesJson,
            caption: draft.caption,
            hashtags: draft.hashtags,
            pilot_scheduled_at: gap.slot.toISOString()
          })
          .select('id')
          .single()
        if (insErr) {
          console.error(
            `  ✗ insert ${piece.type} for ${gap.day}: ${insErr.message}`
          )
          remainingByType[piece.type].unshift(gap)
          continue
        }
        inserted++
        console.log(
          `  + ${piece.type.padEnd(11)} ${gap.day} ${TYPE_SLOTS[piece.type]} (new ${ins.id.slice(0, 8)})`
        )
      }

      await supabase
        .from('ig_angles')
        .update({
          used_count: (angle.used_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', angle.id)
    } catch (err) {
      console.error(
        `  ✗ run ${i + 1} (angle ${angle.id.slice(0, 8)}): ${
          err instanceof Error ? err.message : err
        }`
      )
    }
  }

  const stillMissing =
    remainingByType.carousel.length +
    remainingByType.single_post.length +
    remainingByType.story.length

  console.log('')
  console.log(`Summary:`)
  console.log(`  ${spareOk} spare draft(s) scheduled into gaps`)
  console.log(`  ${inserted} fresh draft(s) generated and scheduled`)
  console.log(`  ${spareOk + inserted} / ${gaps.length} gaps filled`)
  if (stillMissing > 0) {
    console.warn(`  ⚠ ${stillMissing} gap(s) still unfilled.`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
