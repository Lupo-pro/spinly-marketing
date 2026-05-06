import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/instagram/publisher'
import { sendTelegramMessage, TG_EMOJIS } from '@/lib/telegram'

export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await refreshAccessToken()

  try {
    if (result.ok) {
      await sendTelegramMessage(`${TG_EMOJIS.check} IG token refreshed (60 jours)`)
    } else {
      await sendTelegramMessage(`${TG_EMOJIS.warn} IG token refresh FAILED: ${result.error}`)
    }
  } catch {}

  return NextResponse.json(result)
}
