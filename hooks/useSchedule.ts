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
import { useTranslation } from '@/hooks/useTranslation'
import { parseEventClock, currentVirtualTime } from '@/lib/event-clock'

export function useSchedule(days: Day[]) {
  const { t, locale } = useTranslation()
  const todayIdx = useMemo(() => getTodayDayIdx(days), [days])
  const [selectedDay, setSelectedDay] = useState(() => todayIdx >= 0 ? todayIdx : 0)
  const [clockCfg] = useState(() => parseEventClock())
  const [now, setNow] = useState<Date>(() => currentVirtualTime(clockCfg))

  useEffect(() => {
    if (clockCfg.speed === 0) return
    const interval = clockCfg.speed >= 10 ? 500 : 30_000
    const id = setInterval(() => setNow(currentVirtualTime(clockCfg)), interval)
    return () => clearInterval(id)
  }, [clockCfg])

  const sessions: ClassifiedSession[] = useMemo(
    () => classifySessions(days[selectedDay], now),
    [days, selectedDay, now],
  )

  const durationUnits = useMemo(
    () => ({ h: t('boarding.h'), m: t('boarding.m') }),
    [locale], // locale is the stable primitive; t is recreated each render
  )

  const currentSegment: BoardingSegment = useMemo(
    () => getCurrentSegment(days, now, durationUnits),
    [days, now, durationUnits],
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
