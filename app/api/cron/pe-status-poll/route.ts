import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/server'
import { getPost } from '@/lib/posteverywhere/client'
import { alertPendingDrafts } from '@/lib/pilot/alerts'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function deriveStatus(destinations: { status: string }[]): string {
  if (destinations.length === 0) return 'queued'
  const allPublished = destinations.every((d) => d.status === 'published')
  const anyPublished = destinations.some((d) => d.status === 'published')
  const allFailed = destinations.every((d) => d.status === 'failed')
  if (allPublished) return 'published'
  if (anyPublished) return 'partial'
  if (allFailed) return 'failed'
  return 'publishing'
}

// Poll all PE posts that aren't in a terminal state and update their pe_status.
// On Vercel Hobby (1 cron/day cap) this only runs daily; the manual
// "Refresh status" button on each post covers shorter feedback loops.
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServerSupabase()
  const { data: pending } = await supabase
    .from('ig_posts')
    .select('id, pe_post_id, pe_status, pe_published_at')
    .in('pe_status', ['queued', 'scheduled', 'publishing', 'partial'])
    .not('pe_post_id', 'is', null)

  if (!pending || pending.length === 0) {
    let alertResult: { alerted: number; ids: string[] } = { alerted: 0, ids: [] }
    try {
      alertResult = await alertPendingDrafts()
    } catch (err) {
      console.error('[pe-status-poll] alertPendingDrafts failed:', err)
    }
    return NextResponse.json({
      ok: true,
      checked: 0,
      updated: 0,
      alertedDrafts: alertResult.alerted
    })
  }

  let updated = 0
  const errors: { id: string; error: string }[] = []

  for (const post of pending) {
    try {
      const peData = await getPost(post.pe_post_id!)
      const newStatus = deriveStatus(peData.destinations || [])

      if (newStatus !== post.pe_status) {
        await supabase
          .from('ig_posts')
          .update({
            pe_status: newStatus,
            pe_destinations: peData.destinations,
            pe_published_at:
              newStatus === 'published' ? new Date().toISOString() : post.pe_published_at,
            pe_last_check_at: new Date().toISOString()
          })
          .eq('id', post.id)
        updated++
      } else {
        await supabase
          .from('ig_posts')
          .update({ pe_last_check_at: new Date().toISOString() })
          .eq('id', post.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[pe-status-poll] postId=${post.id} error=${message}`)
      errors.push({ id: post.id, error: message })
    }
  }

  // Piggyback the J+1 pending-drafts Telegram alert here so we stay at 2
  // crons total on Hobby. This is independent — if it throws we still
  // return the status-poll result.
  let alertResult: { alerted: number; ids: string[] } = { alerted: 0, ids: [] }
  try {
    alertResult = await alertPendingDrafts()
  } catch (err) {
    console.error('[pe-status-poll] alertPendingDrafts failed:', err)
  }

  return NextResponse.json({
    ok: true,
    checked: pending.length,
    updated,
    errors,
    alertedDrafts: alertResult.alerted
  })
}
