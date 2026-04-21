import { describe, it, expect } from 'vitest'
import {
  sessionStartUtc,
  reminderAtUtc,
  formatNetgsmStartdate,
} from './schedule-time'

describe('sessionStartUtc', () => {
  it('treats schedule times as Europe/Istanbul and returns a UTC Date', () => {
    // Friday April 24, 2026 at 16:15 Istanbul (UTC+3) = 13:15 UTC
    const d = sessionStartUtc('2026-04-24', '16:15', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-24T13:15:00.000Z')
  })

  it('handles early-morning times without DST shift', () => {
    const d = sessionStartUtc('2026-04-25', '07:00', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-25T04:00:00.000Z')
  })

  it('handles late-night times', () => {
    const d = sessionStartUtc('2026-04-24', '21:15', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-24T18:15:00.000Z')
  })

  it('throws when time is null', () => {
    expect(() => sessionStartUtc('2026-04-24', null as unknown as string, 'Europe/Istanbul'))
      .toThrow()
  })
})

describe('reminderAtUtc', () => {
  it('returns session start minus 10 minutes', () => {
    const d = reminderAtUtc('2026-04-24', '16:15', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-24T13:05:00.000Z')
  })
})

describe('formatNetgsmStartdate', () => {
  it('formats a UTC Date back to Istanbul wall-clock ddMMyyyyHHmm', () => {
    // 2026-04-24T13:05:00Z = 16:05 Istanbul on April 24
    const d = new Date('2026-04-24T13:05:00.000Z')
    expect(formatNetgsmStartdate(d, 'Europe/Istanbul')).toBe('240420261605')
  })

  it('pads single-digit month, day, hour, minute', () => {
    // 2026-01-02T03:04:00Z = 06:04 Istanbul on Jan 2
    const d = new Date('2026-01-02T03:04:00.000Z')
    expect(formatNetgsmStartdate(d, 'Europe/Istanbul')).toBe('020120260604')
  })
})
