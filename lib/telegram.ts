export type Severity = 'info' | 'warn' | 'error'

const SEV_ICON: Record<Severity, string> = {
  info:  'INFO',
  warn:  'WARN',
  error: 'ERROR',
}

/**
 * Never throws — if envs are missing or Telegram is down, logs and returns.
 * Alerting must never break the watchdog.
 */
export async function alertOps(
  severity: Severity,
  summary: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('[telegram] missing TELEGRAM_BOT_TOKEN/CHAT_ID; alert dropped:', summary)
    return
  }

  const lines = [`[SMS ALERT · ${SEV_ICON[severity]}]`, summary]
  if (details && Object.keys(details).length > 0) {
    for (const [k, v] of Object.entries(details)) {
      lines.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    }
  }
  const text = lines.join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.warn('[telegram] sendMessage non-2xx:', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.warn('[telegram] sendMessage failed:', err)
  }
}
