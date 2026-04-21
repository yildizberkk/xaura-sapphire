import { describe, it, expect } from 'vitest'
import { parseTime, getCurrentSegment } from './schedule'
import type { Day } from './schedule'

describe('parseTime', () => {
  it('produces an Istanbul-anchored UTC moment regardless of device timezone', () => {
    const d = parseTime('2026-04-24', '10:00')
    expect(d).not.toBeNull()
    // 10:00 Istanbul = 07:00 UTC
    expect(d!.toISOString()).toBe('2026-04-24T07:00:00.000Z')
  })

  it('returns null when timeStr is null', () => {
    expect(parseTime('2026-04-24', null)).toBeNull()
  })
})

describe('getCurrentSegment', () => {
  const days: Day[] = [{
    day: 'Cuma', dayEN: 'Friday', date: '2026-04-24',
    sessions: [{
      start: '10:00', end: '12:30', type: 'general',
      title: 'Giriş',
    }],
  }]

  it('flags times before Istanbul midnight April 24 as pre-event', () => {
    // 20:00 UTC April 23 = 23:00 Istanbul April 23 → pre-event
    const now = new Date('2026-04-23T20:00:00.000Z')
    expect(getCurrentSegment(days, now).type).toBe('pre-event')
  })

  it('flags times after Istanbul midnight April 24 as not pre-event', () => {
    // 22:00 UTC April 23 = 01:00 Istanbul April 24 → event day started
    const now = new Date('2026-04-23T22:00:00.000Z')
    expect(getCurrentSegment(days, now).type).not.toBe('pre-event')
  })
})
