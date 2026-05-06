const SPIN_EMOJI = String.fromCodePoint(0x1f3a1)
const CHECK_EMOJI = String.fromCodePoint(0x2705)
const CROSS_EMOJI = String.fromCodePoint(0x274c)
const WARN_EMOJI = String.fromCodePoint(0x26a0, 0xfe0f)
const CAMERA_EMOJI = String.fromCodePoint(0x1f4f8)

export const TG_EMOJIS = {
  spin: SPIN_EMOJI,
  check: CHECK_EMOJI,
  cross: CROSS_EMOJI,
  warn: WARN_EMOJI,
  camera: CAMERA_EMOJI
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('Telegram not configured')
    return
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Telegram failed: ${res.status} ${body}`)
  }
}
