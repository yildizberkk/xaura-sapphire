// hooks/useSchedule.ts
'use client'
import { useState, useEffect, useMemo } from 'react'
import {
  classifySessions,
  getCurrentSegment,
  getNextSessionDeadline,
} from '@/lib/schedule'
import type { Day, ClassifiedSession, BoardingSegment } from '@/lib/schedule'
import { useTranslation } from '@/hooks/useTranslation'
import { parseEventClock, currentVirtualTime } from '@/lib/event-clock'

export function useSchedule(days: Day[]) {
  const { t, locale } = useTranslation()
  const [clockCfg] = useState(() => parseEventClock())
  const [now, setNow] = useState<Date>(() => currentVirtualTime(clockCfg))

  // Derive todayIdx from virtual clock so time-travel and real event both work
  const todayIdx = useMemo(() => {
    const dateStr = now.toLocaleDateString('sv')
    return days.findIndex(d => d.date === dateStr)
  }, [days, now])

  const [selectedDay, setSelectedDay] = useState(() => {
    const initNow = currentVirtualTime(clockCfg)
    const dateStr = initNow.toLocaleDateString('sv')
    const idx = days.findIndex(d => d.date === dateStr)
    if (idx >= 0) return idx
    // After last event day → show last day; before → show first
    const lastDate = days[days.length - 1]?.date
    if (lastDate && initNow > new Date(lastDate + 'T23:59:59')) return days.length - 1
    return 0
  })

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
