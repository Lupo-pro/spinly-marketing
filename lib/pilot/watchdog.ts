import { getServerSupabase } from '@/lib/supabase/server'

const STUCK_AFTER_MINUTES = 5

// Picks up posts that have been pilot_processing for more than 5 minutes
// without completing, and re-fires the background worker. The worker is
// idempotent (skips render if slides exist, reuses pilot_scheduled_at if set,
// skips publish if pe_post_id exists), so a re-trigger is safe.
//
// Returns the IDs that were retriggered. The worker decides whether each
// step is needed.
export async function runProcessingWatchdog(): Promise<{ retriggered: string[]; errors: string[] }> {
  const supabase = getServerSupabase()
  const cutoffIso = new Date(Date.now() - STUCK_AFTER_MINUTES * 60_000).toISOString()

  const { data: stuck, error } = await supabase
    .from('ig_posts')
    .select('id')
    .eq('pilot_processing', true)
    .lte('pilot_processing_started_at', cutoffIso)

  if (error) {
    console.error('[watchdog] fetch failed:', error.message)
    return { retriggered: [], errors: [error.message] }
  }
  if (!stuck || stuck.length === 0) {
    return { retriggered: [], errors: [] }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const internalSecret = process.env.INTERNAL_PROCESS_SECRET || process.env.CRON_SECRET || ''

  const retriggered: string[] = []
  const errs: string[] = []

  for (const post of stuck) {
    try {
      // Fire-and-forget — same pattern as approve-pilot. We don't want the
      // cron to block on the worker; if it crashes again the next cron run
      // will pick it up.
      fetch(`${baseUrl}/api/ig/process-approved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${internalSecret}`
        },
        body: JSON.stringify({ postId: post.id }),
        cache: 'no-store'
      }).catch((err) => {
        console.error(`[watchdog] retrigger ${post.id} failed:`, err)
      })
      retriggered.push(post.id)
    } catch (err) {
      errs.push(err instanceof Error ? err.message : String(err))
    }
  }

  console.log(`[watchdog] retriggered ${retriggered.length} stuck posts`)
  return { retriggered, errors: errs }
}
