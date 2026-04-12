// app/client-page.tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSchedule } from '@/hooks/useSchedule'
import type { ScheduleData } from '@/lib/schedule'

import StarfieldCanvas   from '@/components/StarfieldCanvas'
import IntroVideo        from '@/components/IntroVideo'
import RegistrationForm  from '@/components/RegistrationForm'
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
  const [phase,  setPhase] = useState<Phase>('loading')
  const [_user,  setUser]  = useState<StoredUser | null>(null) // used for personalization

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
    const full = { ...newUser, expiresAt: '2026-04-28T00:00:00.000Z' }
    setUser(full)
    setPhase('app')
  }

  function prevDay() { setSelectedDay(d => Math.max(0, d - 1)) }
  function nextDay() { setSelectedDay(d => Math.min(schedule.days.length - 1, d + 1)) }

  return (
    <div className={styles.page}>

      {/* Starfield always runs — same bg in every phase */}
      <StarfieldCanvas />

      {/* Prevent any flash of raw content while localStorage is checked */}
      {phase === 'loading' && <div className={styles.loadingScreen} />}

      {/* Intro video — AnimatePresence plays exit animation when phase leaves 'intro' */}
      <AnimatePresence>
        {phase === 'intro' && (
          <IntroVideo key="intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      {/* Registration form — fades in over the starfield (no solid bg) */}
      <AnimatePresence>
        {phase === 'register' && (
          <RegistrationForm key="register" onComplete={handleRegistrationComplete} />
        )}
      </AnimatePresence>

      {/* Main content — only rendered once registered, no flash risk */}
      {phase === 'app' && (
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
      )}

    </div>
  )
}
