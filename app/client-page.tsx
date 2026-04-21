// app/client-page.tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSchedule } from '@/hooks/useSchedule'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_META } from '@/lib/i18n'
import type { ScheduleData } from '@/lib/schedule'

import { LanguageProvider } from '@/components/LanguageProvider'
import StarfieldCanvas   from '@/components/StarfieldCanvas'
import IntroVideo        from '@/components/IntroVideo'
import RegistrationForm  from '@/components/RegistrationForm'
import BoardingPass      from '@/components/BoardingPass'
import CountdownDisplay  from '@/components/CountdownDisplay'
import QuoteDisplay      from '@/components/QuoteDisplay'
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

function Clock({ now }: { now?: Date }) {
  const { locale } = useTranslation()
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      const bcp47 = LOCALE_META[locale].bcp47
      const source = now ?? new Date()
      setTime(source.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    if (now) return
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [locale, now])
  return <p className={styles.clock}>{time}</p>
}

function ClientPageInner({ schedule }: ClientPageProps) {
  const [phase,  setPhase] = useState<Phase>('loading')
  const [user,   setUser]  = useState<StoredUser | null>(null)

  const {
    selectedDay,
    setSelectedDay,
    todayIdx,
    sessions,
    currentSegment,
    nextSessionDeadline,
    now,
  } = useSchedule(schedule.days)

  useEffect(() => {
    const raw = localStorage.getItem('sapphire_user_v4')
    if (raw) {
      try {
        const saved: StoredUser = JSON.parse(raw)
        if (new Date(saved.expiresAt) > new Date()) {
          setUser(saved)
          setPhase('app')
          return
        }
      } catch {}
      localStorage.removeItem('sapphire_user_v4')
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
      <StarfieldCanvas />
      {phase === 'loading' && <div className={styles.loadingScreen} />}

      <AnimatePresence>
        {phase === 'intro' && (
          <IntroVideo key="intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'register' && (
          <RegistrationForm key="register" onComplete={handleRegistrationComplete} />
        )}
      </AnimatePresence>

      {phase === 'app' && (
        <div className={styles.container}>
          <BoardingPass
            days={schedule.days}
            selectedDay={selectedDay}
            todayIdx={todayIdx}
            onDayChange={setSelectedDay}
            segment={currentSegment}
            passenger={user ?? undefined}
          />

          <QuoteDisplay />

          {nextSessionDeadline && (
            <CountdownDisplay deadline={nextSessionDeadline} now={now} />
          )}

          <Clock now={now} />

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

export default function ClientPage({ schedule }: ClientPageProps) {
  return (
    <LanguageProvider>
      <ClientPageInner schedule={schedule} />
    </LanguageProvider>
  )
}
