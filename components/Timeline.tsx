// components/Timeline.tsx
'use client'
import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ClassifiedSession } from '@/lib/schedule'
import SessionRow from './SessionRow'
import styles from './Timeline.module.css'

interface TimelineProps {
  sessions: ClassifiedSession[]
  selectedDay: number
}

// Direction of day transition: +1 = forward (slide left), -1 = backward (slide right)
function useDirection(selectedDay: number) {
  const prev = useRef(selectedDay)
  const dir = selectedDay > prev.current ? 1 : -1
  prev.current = selectedDay
  return dir
}

export default function Timeline({ sessions, selectedDay }: TimelineProps) {
  const direction = useDirection(selectedDay)

  // Swipe gesture state
  const touchStart = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent, onSwipeLeft: () => void, onSwipeRight: () => void) {
    if (touchStart.current === null) return
    const delta = e.changedTouches[0].clientX - touchStart.current
    if (delta < -50) onSwipeLeft()
    if (delta >  50) onSwipeRight()
    touchStart.current = null
  }

  // Compute "you are here" notch position as % of total session span
  const positionedSessions = sessions.filter(s => s.startDt)
  const activeOrNext = sessions.find(s => s.state === 'active' || s.state === 'next')
  const youAreHerePct = (() => {
    if (!activeOrNext?.startDt || positionedSessions.length < 2) return null
    const first = positionedSessions[0].startDt!
    const last  = positionedSessions[positionedSessions.length - 1].startDt!
    const now   = activeOrNext.startDt
    const span  = last.getTime() - first.getTime()
    if (span === 0) return null
    return Math.min(100, Math.max(0, ((now.getTime() - first.getTime()) / span) * 100))
  })()

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  }

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.header}>Uçuş Programı</div>

      <div className={styles.inner}>
        <div className={styles.track} />

        {/* "You are here" notch */}
        {youAreHerePct !== null && (
          <div
            className={styles.youAreHere}
            style={{ top: `calc(10px + ${youAreHerePct}% * (100% - 20px) / 100)` }}
            aria-hidden
          >
            <div className={styles.youAreHereRing} />
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={selectedDay}
            className={styles.sessions}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.32, 0, 0.67, 0] }}
          >
            {sessions.map((s, i) => (
              <SessionRow key={`${s.title}-${s.start}`} session={s} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerText}>Xaura Global · Sapphire Momentum II · Nisan 2026</div>
      </div>
    </motion.div>
  )
}
