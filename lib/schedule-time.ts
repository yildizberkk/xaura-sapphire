/**
 * Istanbul-anchored date helpers for SMS scheduling.
 *
 * schedule.json stores wall-clock Istanbul times as naive "HH:MM" strings.
 * Vercel functions run in UTC. This module is the ONLY place server-side
 * code should convert schedule times to absolute UTC moments.
 *
 * NOTE: client-side rendering in lib/schedule.ts now anchors to +03:00 explicitly
 * (see parseTime there). This module remains the canonical TZ helper for server
 * code that must handle arbitrary IANA zones.
 */

/** Parse `YYYY-MM-DD` + `HH:MM` as a wall-clock time in `tz`, return UTC Date. */
export function sessionStartUtc(
  dateStr: string,
  timeStr: string,
  tz: string,
): Date {
  if (!timeStr) throw new Error(`sessionStartUtc: time is required (got ${timeStr})`)
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)

  const utcGuess = Date.UTC(y, m - 1, d, h, min, 0, 0)
  const offsetMs = tzOffsetMs(utcGuess, tz)
  return new Date(utcGuess - offsetMs)
}

/** Session start minus 10 minutes. */
export function reminderAtUtc(
  dateStr: string,
  timeStr: string,
  tz: string,
): Date {
  const start = sessionStartUtc(dateStr, timeStr, tz)
  return new Date(start.getTime() - 10 * 60_000)
}

/** Convert a UTC Date to Istanbul wall-clock `ddMMyyyyHHmm` for Netgsm. */
export function formatNetgsmStartdate(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: string) =>
    parts.find(p => p.type === type)?.value ?? '00'

  const hh = get('hour') === '24' ? '00' : get('hour')

  return `${get('day')}${get('month')}${get('year')}${hh}${get('minute')}`
}

/** Offset (in ms) of `tz` for the given UTC instant. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(new Date(utcMs))
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0)
  const hh = get('hour') === 24 ? 0 : get('hour')
  const asIfLocal = Date.UTC(
    get('year'), get('month') - 1, get('day'),
    hh, get('minute'), get('second'),
  )
  return asIfLocal - utcMs
}
