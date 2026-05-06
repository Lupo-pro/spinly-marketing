import { getServerSupabase } from '@/lib/supabase/server'
import { getAccount } from './publisher'

const COLOMBIA_OFFSET_HOURS = 5 // UTC-5

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const

type DaySlots = { day: string; times: string[] }

function slotsForPhase(
  phase: string,
  postingSchedule: Record<string, string[]> | null | undefined
): DaySlots[] {
  if (phase === 'phase_1') {
    return [
      { day: 'monday', times: ['13:00'] },
      { day: 'tuesday', times: ['13:00'] },
      { day: 'wednesday', times: ['13:00'] },
      { day: 'thursday', times: ['13:00'] },
      { day: 'friday', times: ['13:00'] },
      { day: 'saturday', times: [] },
      { day: 'sunday', times: [] }
    ]
  }
  if (phase === 'phase_2') {
    return [
      { day: 'monday', times: ['09:00', '18:00'] },
      { day: 'tuesday', times: ['09:00', '18:00'] },
      { day: 'wednesday', times: ['09:00', '18:00'] },
      { day: 'thursday', times: ['09:00', '18:00'] },
      { day: 'friday', times: ['09:00', '18:00'] },
      { day: 'saturday', times: ['11:00'] },
      { day: 'sunday', times: ['11:00'] }
    ]
  }
  // 'full' — use account.posting_schedule
  const schedule = postingSchedule ?? {}
  return Object.entries(schedule).map(([day, times]) => ({ day, times }))
}

function computePhase(daysSinceStart: number): 'phase_1' | 'phase_2' | 'full' {
  if (daysSinceStart >= 30) return 'full'
  if (daysSinceStart >= 14) return 'phase_2'
  return 'phase_1'
}

// Build a UTC Date for a Colombia local "HH:MM" on the given calendar day
// (date is interpreted as local-day-of-Lupo's-machine, but since we only use
// UTC components the local TZ doesn't matter — we build it from year/month/day).
function colombiaTimeToUtc(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const utc = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      h + COLOMBIA_OFFSET_HOURS,
      m,
      0,
      0
    )
  )
  return utc
}

// Returns the next available Colombia-local slot in UTC, or null if none in 14d.
export async function getNextSlot(): Promise<Date | null> {
  const slots = await getNextSlots(1)
  return slots[0] ?? null
}

// Same as getNextSlot but returns up to N upcoming slots (used for monitoring).
export async function getNextSlots(count: number): Promise<Date[]> {
  const supabase = getServerSupabase()
  const account = await getAccount()

  const now = new Date()
  const warmupStart = new Date(account.warmup_started_at)
  const daysSinceStart = Math.floor(
    (now.getTime() - warmupStart.getTime()) / 86400_000
  )

  const currentPhase = computePhase(daysSinceStart)
  if (currentPhase !== account.warmup_phase) {
    await supabase.from('ig_account').update({ warmup_phase: currentPhase }).eq('id', account.id)
  }

  const slotConfig = slotsForPhase(currentPhase, account.posting_schedule)

  const found: Date[] = []
  for (let dayOffset = 0; dayOffset < 14 && found.length < count; dayOffset++) {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() + dayOffset)
    const dayName = DAY_NAMES[date.getUTCDay()]
    const daySlots = slotConfig.find((s) => s.day === dayName)?.times ?? []

    for (const time of daySlots) {
      const slotDate = colombiaTimeToUtc(date, time)
      if (slotDate <= now) continue

      const { data: existing } = await supabase
        .from('ig_posts')
        .select('id')
        .eq('status', 'scheduled')
        .gte('scheduled_for', new Date(slotDate.getTime() - 30 * 60_000).toISOString())
        .lte('scheduled_for', new Date(slotDate.getTime() + 30 * 60_000).toISOString())
        .limit(1)

      if (!existing || existing.length === 0) {
        found.push(slotDate)
        if (found.length >= count) break
      }
    }
  }

  return found
}

export async function schedulePost(
  postId: string
): Promise<{ ok: boolean; scheduledFor?: Date; error?: string }> {
  const supabase = getServerSupabase()
  const slot = await getNextSlot()

  if (!slot) {
    return { ok: false, error: 'No slot available in next 14 days' }
  }

  const { error } = await supabase
    .from('ig_posts')
    .update({
      status: 'scheduled',
      scheduled_for: slot.toISOString()
    })
    .eq('id', postId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, scheduledFor: slot }
}
