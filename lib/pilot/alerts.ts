import { getServerSupabase } from '@/lib/supabase/server'
import { sendTelegramMessage, TG_EMOJIS } from '@/lib/telegram'

const ALERT_AFTER_HOURS = 24

// Sends one batch Telegram alert for drafts that have been waiting >24h
// without validation. Marks them as alerted so we don't spam the same
// drafts every cron run. Idempotent — safe to call multiple times per day.
export async function alertPendingDrafts(): Promise<{ alerted: number; ids: string[] }> {
  const supabase = getServerSupabase()
  const cutoff = new Date(Date.now() - ALERT_AFTER_HOURS * 60 * 60 * 1000).toISOString()

  const { data: pending, error } = await supabase
    .from('ig_posts')
    .select('id')
    .eq('status', 'draft')
    .lte('generated_at', cutoff)
    .eq('pilot_telegram_alerted', false)

  if (error) {
    console.error('[pilot-alerts] fetch failed:', error.message)
    return { alerted: 0, ids: [] }
  }
  if (!pending || pending.length === 0) {
    return { alerted: 0, ids: [] }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spinly-marketing.vercel.app'
  const ids = pending.map((p) => p.id)

  try {
    await sendTelegramMessage(
      `${TG_EMOJIS.warn} ${pending.length} drafts en attente de validation depuis +24h.\n\n` +
        `Va sur ${appUrl}/admin/instagram/pilot pour swipe-valider.`
    )
  } catch (err) {
    console.error('[pilot-alerts] Telegram send failed:', err)
    // Still mark them — we'll catch up next cycle anyway, and sending again
    // 24h later for the same posts would be noise.
  }

  const { error: updateErr } = await supabase
    .from('ig_posts')
    .update({ pilot_telegram_alerted: true })
    .in('id', ids)

  if (updateErr) {
    console.error('[pilot-alerts] mark-alerted failed:', updateErr.message)
  }

  return { alerted: pending.length, ids }
}
