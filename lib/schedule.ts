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

// ── Session abbreviations ─────────────────────────────────────────

export const SESSION_CODES: Record<string, string> = {
  'Giriş': 'G',
  'Öğle Yemeği': 'ÖY',
  'Kahvaltı': 'KH',
  'Serbest Zaman ve Akşam Yemeği': 'AY',
  'Akşam Yemeği': 'AY',
  'Ara': 'ARA',
  'Ruby Okulu': 'RO',
  'Kapı Açılış': 'KA',
  '2. Yıl Dönümü Açılış Konuşması': 'AK',
  'Konser': 'KS',
  'Eğitim - 1': 'E1',
  'Eğitim - 2': 'E2',
  'Eğitim - 3': 'E3',
  'Eğitim - 4': 'E4',
  'Sistem Kurmak: Sen Olmadan Çalışan Organizasyon': 'SK',
  'Vizyon Liderliği': 'VL',
  'Takdir Töreni': 'TT',
  'Oda Boşaltma ve Coffee Break': 'OB',
  'Kapanış Konuşması': 'KK',
}

// ── Boarding segment ──────────────────────────────────────────────

export interface BoardingSegment {
  type: 'pre-event' | 'active' | 'gap' | 'end-of-day' | 'between-days' | 'ended'
  dep: string
  depName: string
  arr: string
  arrName: string
  kalkis: string | null   // "HH:MM"
  inis: string | null     // "HH:MM"
  suresi: string | null   // e.g. "2sa 30dak"
  dateStr: string | null  // "YYYY-MM-DD" for Tarih field
}

interface FlatSess {
  dayIdx: number
  code: string
  title: string
  dateStr: string
  startDt: Date | null
  effectiveEndDt: Date   // never null — midnight fallback for last-of-day
  hasKnownEnd: boolean   // false when midnight fallback was used
}

function sessionCode(title: string): string {
  return SESSION_CODES[title] ?? title.slice(0, 2).toUpperCase()
}

function fmtHHMM(d: Date): string {
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDuration(ms: number): string {
  const total = Math.round(ms / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}dak`
  if (m === 0) return `${h}sa`
  return `${h}sa ${m}dak`
}

function buildFlatSessions(days: Day[]): FlatSess[] {
  const flat: FlatSess[] = []
  for (let di = 0; di < days.length; di++) {
    const day = days[di]
    for (let si = 0; si < day.sessions.length; si++) {
      const s = day.sessions[si]
      const startDt = parseTime(day.date, s.start)
      let effectiveEndDt: Date | null = parseTime(day.date, s.end)
      let hasKnownEnd = effectiveEndDt !== null

      if (!effectiveEndDt) {
        // Look for next session in same day with a known start
        for (let ni = si + 1; ni < day.sessions.length; ni++) {
          const ns = parseTime(day.date, day.sessions[ni].start)
          if (ns) { effectiveEndDt = ns; hasKnownEnd = true; break }
        }
      }

      if (!effectiveEndDt) {
        // Last session of the day with no end — runs until midnight
        effectiveEndDt = new Date(day.date)
        effectiveEndDt.setHours(23, 59, 59, 999)
        hasKnownEnd = false
      }

      flat.push({
        dayIdx: di,
        code: sessionCode(s.title),
        title: s.title,
        dateStr: day.date,
        startDt,
        effectiveEndDt,
        hasKnownEnd,
      })
    }
  }
  return flat
}

export function getCurrentSegment(days: Day[], now: Date): BoardingSegment {
  const eventDay0Midnight = new Date('2026-04-24T00:00:00')

  if (now < eventDay0Midnight) {
    return {
      type: 'pre-event',
      dep: 'AYT', depName: 'Antalya',
      arr: 'KP',  arrName: 'Kremlin Palace',
      kalkis: null, inis: null, suresi: null, dateStr: null,
    }
  }

  const flat = buildFlatSessions(days)

  // ── Find active session ───────────────────────────────────────
  const activeIdx = flat.findIndex(s =>
    s.startDt !== null && now >= s.startDt && now < s.effectiveEndDt
  )

  if (activeIdx >= 0) {
    const curr = flat[activeIdx]
    const next = activeIdx < flat.length - 1 ? flat[activeIdx + 1] : null
    return {
      type: 'active',
      dep: curr.code,    depName: curr.title,
      arr: next?.code  ?? 'KP', arrName: next?.title ?? 'Kremlin Palace',
      kalkis: curr.startDt ? fmtHHMM(curr.startDt) : null,
      inis:   curr.hasKnownEnd ? fmtHHMM(curr.effectiveEndDt) : null,
      suresi: curr.startDt && curr.hasKnownEnd
        ? fmtDuration(curr.effectiveEndDt.getTime() - curr.startDt.getTime())
        : null,
      dateStr: curr.dateStr,
    }
  }

  // ── Find surrounding gap ──────────────────────────────────────
  let prevIdx = -1
  for (let i = 0; i < flat.length; i++) {
    if (flat[i].effectiveEndDt <= now) prevIdx = i
  }

  let nextIdx = -1
  for (let i = 0; i < flat.length; i++) {
    if (flat[i].startDt && flat[i].startDt! > now) { nextIdx = i; break }
  }

  // No next session → event ended
  if (nextIdx < 0) {
    return {
      type: 'ended',
      dep: '', depName: '', arr: '', arrName: '',
      kalkis: null, inis: null, suresi: null, dateStr: null,
    }
  }

  const nextSess = flat[nextIdx]

  // Nothing before now → before first session of the day (after Apr 24 midnight)
  if (prevIdx < 0) {
    return {
      type: 'between-days',
      dep: 'KP', depName: 'Kremlin Palace',
      arr: nextSess.code, arrName: nextSess.title,
      kalkis: null, inis: null, suresi: null,
      dateStr: nextSess.dateStr,
    }
  }

  const prevSess = flat[prevIdx]

  // Cross-day logic
  if (prevSess.dayIdx !== nextSess.dayIdx) {
    const nextDayMidnight = new Date(nextSess.dateStr)
    nextDayMidnight.setHours(0, 0, 0, 0)
    if (now >= nextDayMidnight) {
      // Past midnight → KP → first session of new day
      return {
        type: 'between-days',
        dep: 'KP', depName: 'Kremlin Palace',
        arr: nextSess.code, arrName: nextSess.title,
        kalkis: null, inis: null, suresi: null,
        dateStr: nextSess.dateStr,
      }
    }
    // Before midnight, after last session → end-of-day
    return {
      type: 'end-of-day',
      dep: prevSess.code, depName: prevSess.title,
      arr: 'KP', arrName: 'Kremlin Palace',
      kalkis: prevSess.startDt ? fmtHHMM(prevSess.startDt) : null,
      inis: null, suresi: null,
      dateStr: prevSess.dateStr,
    }
  }

  // Same-day gap between sessions (implicit break)
  return {
    type: 'gap',
    dep: prevSess.code, depName: prevSess.title,
    arr: nextSess.code, arrName: nextSess.title,
    kalkis: prevSess.hasKnownEnd ? fmtHHMM(prevSess.effectiveEndDt) : null,
    inis:   nextSess.startDt ? fmtHHMM(nextSess.startDt!) : null,
    suresi: prevSess.hasKnownEnd && nextSess.startDt
      ? fmtDuration(nextSess.startDt!.getTime() - prevSess.effectiveEndDt.getTime())
      : null,
    dateStr: prevSess.dateStr,
  }
}

export function getNextSessionDeadline(days: Day[], now: Date): Date | null {
  for (const day of days) {
    for (const session of day.sessions) {
      const startDt = parseTime(day.date, session.start)
      if (startDt && startDt > now) return startDt
    }
  }
  return null
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
