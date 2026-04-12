// app/client-page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSchedule } from '@/hooks/useSchedule'
import type { ScheduleData } from '@/lib/schedule'

import IntroVideo        from '@/components/IntroVideo'
import RegistrationForm  from '@/components/RegistrationForm'
import StarfieldCanvas   from '@/components/StarfieldCanvas'
import BoardingPass      from '@/components/BoardingPass'
import FlightStatusBar   from '@/components/FlightStatusBar'
import CountdownDisplay  from '@/components/CountdownDisplay'
import Timeline          from '@/components/Timeline'
import styles from './client-page.module.css'

type Phase = 'loading' | 'intro' | 'register' | 'app'

interface StoredUser {
  firstName: string
  lastName:  string
  expiresAt: string
}

interface ClientPageProps {
  schedule: ScheduleData
}

export default function ClientPage({ schedule }: ClientPageProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [user,  setUser]  = useState<StoredUser | null>(null)

  const {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    status,
    isPreEvent,
    msUntilEvent,
  } = useSchedule(schedule.days)

  useEffect(() => {
    const raw = localStorage.getItem('sapphire_user')
    if (raw) {
      try {
        const saved: StoredUser = JSON.parse(raw)
        if (new Date(saved.expiresAt) > new Date()) {
          setUser(saved)
          setPhase('app')
          return
        }
      } catch {}
      localStorage.removeItem('sapphire_user')
    }
    setPhase('intro')
  }, [])

  function handleIntroComplete() {
    setPhase('register')
  }

  function handleRegistrationComplete(newUser: { firstName: string; lastName: string }) {
    setUser({ ...newUser, expiresAt: '2026-04-28T00:00:00.000Z' })
    setPhase('app')
  }

  function prevDay() { setSelectedDay(d => Math.max(0, d - 1)) }
  function nextDay() { setSelectedDay(d => Math.min(schedule.days.length - 1, d + 1)) }

  return (
    <div className={styles.page}>

      {/* Overlays — rendered above the main app */}
      {phase === 'loading'   && <div className={styles.loadingScreen} />}
      {phase === 'intro'     && <IntroVideo onComplete={handleIntroComplete} />}
      {phase === 'register'  && <RegistrationForm onComplete={handleRegistrationComplete} />}

      {/* Main app — always mounted once phase leaves 'loading', just covered by overlays */}
      {phase !== 'loading' && (
        <>
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
        </>
      )}

    </div>
  )
}
