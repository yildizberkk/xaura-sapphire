// hooks/useSchedule.ts
'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  classifySessions,
  getFlightStatus,
  getTodayDayIdx,
} from '@/lib/schedule'
import type { Day, ClassifiedSession, FlightStatus } from '@/lib/schedule'

const EVENT_START = new Date('2026-04-24T10:00:00')

export function useSchedule(days: Day[]) {
  const todayIdx = useMemo(() => getTodayDayIdx(days), [days])
  const [selectedDay, setSelectedDay] = useState(() => todayIdx >= 0 ? todayIdx : 0)
  const [now, setNow] = useState<Date>(() => new Date())

  // Tick every 30 seconds to re-classify sessions
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sessions: ClassifiedSession[] = useMemo(
    () => classifySessions(days[selectedDay], now),
    [days, selectedDay, now],
  )

  const status: FlightStatus = useMemo(
    () => getFlightStatus(days[selectedDay], sessions, now),
    [days, selectedDay, sessions, now],
  )

  const msUntilEvent = Math.max(0, EVENT_START.getTime() - now.getTime())
  const isPreEvent   = msUntilEvent > 0

  return {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    status,
    now,
    isPreEvent,
    msUntilEvent,
  }
}
