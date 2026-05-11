import { addDays, parseISO, set, isBefore, addMinutes } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { getServerSupabase } from '@/lib/supabase/server'

// All scheduling rules are anchored in Bogotá local time. Slots are stored
// as 'HH:MM' strings, daily quotas are computed against Bogotá calendar days.
const TZ = 'America/Bogota'

// Hard scheduling rule: 2 posts per day, total, across all content types,
// at exactly these Bogotá-local times. Overrides any per-type slots/quotas
// that may still live in pilot_settings (kept for backward compatibility but
// no longer consulted for slot/quota decisions — see findNextSlot below).
export const SHARED_SLOTS = ['08:00', '12:00'] as const
export const MAX_POSTS_PER_DAY = 2

// 30 min around an existing slot is treated as occupied. Catches legacy posts
// scheduled at off-grid times (e.g. 07:50) that would otherwise sit next to
// a new 08:00 slot.
const SLOT_OCCUPATION_TOLERANCE_MIN = 30

// Don't schedule a post sooner than this many minutes from now — gives PE
// time to receive the request and not race the moment "publish now".
const MIN_LEAD_MINUTES = 30

export type PilotContentType = 'carousel' | 'single_post' | 'story'

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

export async function findNextSlot(fromDate: Date = new Date()): Promise<Date | null> {
  const settings = await getPilotSettings()
  const supabase = getServerSupabase()

  const horizonEnd = addDays(fromDate, settings.scheduling_horizon_days)

  // Posts already locked into a future slot — pulled from pilot_scheduled_at
  // so we account for slots reserved before PE has confirmed the schedule.
  const { data: occupied } = await supabase
    .from('ig_posts')
    .select('pilot_scheduled_at')
    .gte('pilot_scheduled_at', fromDate.toISOString())
    .lte('pilot_scheduled_at', horizonEnd.toISOString())
    .not('pilot_scheduled_at', 'is', null)

  const occupiedDates: Date[] = (occupied ?? [])
    .filter((s) => s.pilot_scheduled_at)
    .map((s) => parseISO(s.pilot_scheduled_at as string))

  const minLead = addMinutes(fromDate, MIN_LEAD_MINUTES)
  const tolMs = SLOT_OCCUPATION_TOLERANCE_MIN * 60 * 1000

  for (let dayOffset = 0; dayOffset <= settings.scheduling_horizon_days; dayOffset++) {
    const day = addDays(fromDate, dayOffset)
    const dayKey = bogotaDayKey(day)

    const countOnDay = occupiedDates.filter((d) => bogotaDayKey(d) === dayKey).length
    if (countOnDay >= MAX_POSTS_PER_DAY) continue

    for (const slotStr of SHARED_SLOTS) {
      const slotUtc = utcForSlot(day, slotStr)
      if (isBefore(slotUtc, minLead)) continue

      const isOccupied = occupiedDates.some(
        (d) => Math.abs(d.getTime() - slotUtc.getTime()) < tolMs
      )
      if (isOccupied) continue

      return slotUtc
    }
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
  const slot = await findNextSlot()
  if (!slot) throw new Error('No slot available in scheduling horizon')

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
