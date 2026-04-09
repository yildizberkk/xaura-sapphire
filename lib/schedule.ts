// lib/schedule.ts

export type SessionType =
  | 'general' | 'meal' | 'session'
  | 'keynote' | 'entertainment' | 'ceremony' | 'break'

export type SessionState = 'active' | 'next' | 'past' | 'future'

export interface RawSession {
  start: string | null
  end: string | null
  title: string
  titleEN?: string
  subtitle?: string
  type: SessionType
}

export interface Day {
  day: string
  dayEN: string
  date: string // "YYYY-MM-DD"
  sessions: RawSession[]
}

export interface ScheduleData {
  event: {
    name: string
    subtitle: string
    dates: string
    location: string
    address: string
  }
  days: Day[]
}

export interface ClassifiedSession extends RawSession {
  state: SessionState
  startDt: Date | null
  endDt: Date | null
  /** 0–100 when state === 'active', null otherwise */
  progressPct: number | null
}

export type FlightStatusKey = 'scheduled' | 'active' | 'boarding' | 'landed'

export interface FlightStatus {
  text: string
  key: FlightStatusKey
}

// ── Helpers ──────────────────────────────────────────────────────

export function parseTime(dateStr: string, timeStr: string | null): Date | null {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(dateStr)
  d.setHours(h, m, 0, 0)
  return d
}

export function getTodayDayIdx(days: Day[]): number {
  const today = new Date().toLocaleDateString('sv') // "YYYY-MM-DD"
  return days.findIndex(d => d.date === today)
}

export function classifySessions(day: Day, now: Date): ClassifiedSession[] {
  const parsed = day.sessions.map(s => ({
    ...s,
    startDt: parseTime(day.date, s.start),
    endDt:   parseTime(day.date, s.end),
    state:       'future' as SessionState,
    progressPct: null as number | null,
  }))

  // Find active
  let activeIdx = -1
  for (let i = 0; i < parsed.length; i++) {
    const s = parsed[i]
    if (!s.startDt) continue
    let eff = s.endDt
    if (!eff) {
      const nxt = parsed.slice(i + 1).find(n => n.startDt)
      eff = nxt?.startDt ?? new Date(s.startDt.getTime() + 90 * 60_000)
    }
    if (now >= s.startDt && now <= eff) {
      activeIdx = i
      const duration = eff.getTime() - s.startDt.getTime()
      const elapsed  = now.getTime() - s.startDt.getTime()
      parsed[i].progressPct = Math.min(100, (elapsed / duration) * 100)
      break
    }
  }

  // Find next
  let nextIdx = -1
  const from = activeIdx >= 0 ? activeIdx + 1 : 0
  for (let i = from; i < parsed.length; i++) {
    if (parsed[i].startDt && parsed[i].startDt! > now) { nextIdx = i; break }
  }

  return parsed.map((s, i) => ({
    ...s,
    state: i === activeIdx ? 'active'
         : i === nextIdx   ? 'next'
         : (s.startDt && s.startDt < now) ? 'past'
         : 'future',
  }))
}

export function getFlightStatus(
  day: Day,
  sessions: ClassifiedSession[],
  now: Date,
): FlightStatus {
  const d0 = new Date(day.date); d0.setHours(0, 0, 0, 0)
  const d1 = new Date(day.date); d1.setHours(23, 59, 59, 999)
  if (now < d0) return { text: 'Bekleniyor',  key: 'scheduled' }
  if (now > d1) return { text: 'Tamamlandı',  key: 'landed' }
  if (sessions.some(s => s.state === 'active')) return { text: 'Aktif Uçuş', key: 'active' }
  if (sessions.some(s => s.state === 'next'))   return { text: 'İnişe Hazır', key: 'boarding' }
  return { text: 'Aktif', key: 'active' }
}
