import { addDays, parseISO, set, isBefore, addMinutes } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { getServerSupabase } from '@/lib/supabase/server'

// All scheduling rules are anchored in Bogotá local time. Slots are stored
// as 'HH:MM' strings, daily quotas are computed against Bogotá calendar days.
const TZ = 'America/Bogota'

export type PilotContentType = 'carousel' | 'single_post' | 'story'

// Hard scheduling rule: 1 post per content_type per day at a fixed Bogotá-local
// slot. Max 3 posts/day total. If a given type has no draft for a day, that
// slot stays empty — we never double up on the same type within a day, and we
// never substitute another type's slot. Per-type slots in pilot_settings are
// kept for backward compatibility but no longer consulted.
export const TYPE_SLOTS: Record<PilotContentType, string> = {
  carousel: '08:00',
  single_post: '12:00',
  story: '18:00'
}
export const MAX_POSTS_PER_DAY = 3

// 30 min around an existing slot is treated as occupied. Catches legacy posts
// scheduled at off-grid times (e.g. 07:50) that would otherwise sit next to
// a new 08:00 slot.
const SLOT_OCCUPATION_TOLERANCE_MIN = 30

// Don't schedule a post sooner than this many minutes from now — gives PE
// time to receive the request and not race the moment "publish now".
const MIN_LEAD_MINUTES = 30

export interface PilotSettings {
  enabled: boolean
  carousel_slots: string[]
  single_post_slots: string[]
  story_slots: string[]
  carousel_platforms: string
  single_post_platforms: string
  story_platforms: string
  max_carousels_per_day: number
  max_single_posts_per_day: number
  max_stories_per_day: number
  min_hours_between_same_type: number
  scheduling_horizon_days: number
  earliest_hour: number
  latest_hour: number
}

export async function getPilotSettings(): Promise<PilotSettings> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('pilot_settings')
    .select('*')
    .eq('id', 'global')
    .single()
  if (error || !data) {
    throw new Error(`pilot_settings missing — apply migration 006: ${error?.message ?? 'not found'}`)
  }
  return data as PilotSettings
}

function pickPlatforms(settings: PilotSettings, type: PilotContentType): string[] {
  const csv =
    type === 'carousel'
      ? settings.carousel_platforms
      : type === 'single_post'
        ? settings.single_post_platforms
        : settings.story_platforms
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

// Returns midnight in Bogotá for the given UTC date, expressed as a UTC Date.
function bogotaDayKey(d: Date): string {
  const zoned = toZonedTime(d, TZ)
  const y = zoned.getFullYear()
  const m = String(zoned.getMonth() + 1).padStart(2, '0')
  const day = String(zoned.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Build the UTC instant for "HH:MM on the Bogotá calendar day of `bogotaDay`".
function utcForSlot(bogotaDay: Date, slotStr: string): Date {
  const [h, m] = slotStr.split(':').map(Number)
  const zoned = toZonedTime(bogotaDay, TZ)
  const slotZoned = set(zoned, { hours: h, minutes: m, seconds: 0, milliseconds: 0 })
  return fromZonedTime(slotZoned, TZ)
}

export async function findNextSlot(
  contentType: PilotContentType,
  fromDate: Date = new Date()
): Promise<Date | null> {
  const settings = await getPilotSettings()
  const supabase = getServerSupabase()

  // +1 day: horizonEnd bounds the occupied-slots query, and the day loop below
  // can pick slots on day `fromDate + horizon_days` at an hour LATER than
  // fromDate's time-of-day. Cutting the query at exactly +horizon_days made
  // those end-of-horizon slots invisible → every subsequent call stacked onto
  // the same last day (incident 2026-07-17: 28 posts on the same slot).
  const horizonEnd = addDays(fromDate, settings.scheduling_horizon_days + 1)

  // Pull both pilot_scheduled_at AND content_type so we can enforce "≤1 post
  // per (day, content_type)" — a carousel slot taken at 08:00 blocks the next
  // carousel from landing on that day even if 12:00/18:00 are free.
  const { data: occupied } = await supabase
    .from('ig_posts')
    .select('pilot_scheduled_at, content_type')
    .gte('pilot_scheduled_at', fromDate.toISOString())
    .lte('pilot_scheduled_at', horizonEnd.toISOString())
    .not('pilot_scheduled_at', 'is', null)

  const occupiedRows = (occupied ?? [])
    .filter((s) => s.pilot_scheduled_at)
    .map((s) => ({
      date: parseISO(s.pilot_scheduled_at as string),
      type: (s.content_type ?? 'carousel') as PilotContentType
    }))

  const minLead = addMinutes(fromDate, MIN_LEAD_MINUTES)
  const tolMs = SLOT_OCCUPATION_TOLERANCE_MIN * 60 * 1000
  const slotStr = TYPE_SLOTS[contentType]

  for (let dayOffset = 0; dayOffset <= settings.scheduling_horizon_days; dayOffset++) {
    const day = addDays(fromDate, dayOffset)
    const dayKey = bogotaDayKey(day)

    // Same-type-already-on-day → skip the day for this type. We never publish
    // two carousels (or two single_posts, or two stories) on the same day.
    const sameTypeOnDay = occupiedRows.some(
      (r) => bogotaDayKey(r.date) === dayKey && r.type === contentType
    )
    if (sameTypeOnDay) continue

    const slotUtc = utcForSlot(day, slotStr)
    if (isBefore(slotUtc, minLead)) continue

    // Off-grid legacy post sitting within tolerance of this slot still blocks
    // (would visually look like a duplicate). Cross-type collisions only
    // happen on legacy data; normal data lands on distinct 08/12/18 slots.
    const isOccupied = occupiedRows.some(
      (r) => Math.abs(r.date.getTime() - slotUtc.getTime()) < tolMs
    )
    if (isOccupied) continue

    return slotUtc
  }

  return null
}

export async function getPlatformsForType(type: PilotContentType): Promise<string[]> {
  const settings = await getPilotSettings()
  return pickPlatforms(settings, type)
}

export async function pilotSchedulePost(
  postId: string
): Promise<{ scheduledAt: Date; platforms: string[] }> {
  const supabase = getServerSupabase()
  const { data: post, error } = await supabase
    .from('ig_posts')
    .select('content_type')
    .eq('id', postId)
    .single()
  if (error || !post) throw new Error(`Post not found: ${error?.message ?? postId}`)

  const contentType = (post.content_type ?? 'carousel') as PilotContentType
  const slot = await findNextSlot(contentType)
  if (!slot) throw new Error(`No ${contentType} slot available in scheduling horizon`)

  const platforms = await getPlatformsForType(contentType)

  const { error: updateErr } = await supabase
    .from('ig_posts')
    .update({
      pilot_scheduled_at: slot.toISOString(),
      pilot_platforms: platforms
    })
    .eq('id', postId)
  if (updateErr) throw new Error(`Failed to save pilot slot: ${updateErr.message}`)

  return { scheduledAt: slot, platforms }
}
