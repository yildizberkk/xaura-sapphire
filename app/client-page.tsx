// app/client-page.tsx
'use client'
import { useSchedule } from '@/hooks/useSchedule'
import type { ScheduleData } from '@/lib/schedule'

import IntroVideo      from '@/components/IntroVideo'
import StarfieldCanvas  from '@/components/StarfieldCanvas'
import BoardingPass     from '@/components/BoardingPass'
import FlightStatusBar  from '@/components/FlightStatusBar'
import CountdownDisplay from '@/components/CountdownDisplay'
import Timeline         from '@/components/Timeline'
import styles from './client-page.module.css'

interface ClientPageProps {
  schedule: ScheduleData
}

export default function ClientPage({ schedule }: ClientPageProps) {
  const {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    status,
    isPreEvent,
    msUntilEvent,
  } = useSchedule(schedule.days)

  function prevDay() { setSelectedDay(d => Math.max(0, d - 1)) }
  function nextDay() { setSelectedDay(d => Math.min(schedule.days.length - 1, d + 1)) }

  return (
    <div className={styles.page}>
      <IntroVideo />
      <StarfieldCanvas />

      <div className={styles.container}>
        <BoardingPass
          days={schedule.days}
          selectedDay={selectedDay}
          todayIdx={todayIdx}
          onDayChange={setSelectedDay}
        />

        <FlightStatusBar status={status} />

        {isPreEvent && (
          <CountdownDisplay msUntilEvent={msUntilEvent} />
        )}

        <Timeline
          sessions={sessions}
          selectedDay={selectedDay}
          onSwipeLeft={nextDay}
          onSwipeRight={prevDay}
        />
      </div>
    </div>
  )
}
