// hooks/useSchedule.ts
'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  classifySessions,
  getCurrentSegment,
  getNextSessionDeadline,
  getTodayDayIdx,
} from '@/lib/schedule'
import type { Day, ClassifiedSession, BoardingSegment } from '@/lib/schedule'

export function useSchedule(days: Day[]) {
  const todayIdx = useMemo(() => getTodayDayIdx(days), [days])
  const [selectedDay, setSelectedDay] = useState(() => todayIdx >= 0 ? todayIdx : 0)
  const [now, setNow] = useState<Date>(() => new Date())

  // Tick every 30 seconds — enough for session boundary detection
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const sessions: ClassifiedSession[] = useMemo(
    () => classifySessions(days[selectedDay], now),
    [days, selectedDay, now],
  )

  const currentSegment: BoardingSegment = useMemo(
    () => getCurrentSegment(days, now),
    [days, now],
  )

  const nextSessionDeadline: Date | null = useMemo(
    () => getNextSessionDeadline(days, now),
    [days, now],
  )

  return {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    now,
    currentSegment,
    nextSessionDeadline,
  }
}
