// components/CountdownDisplay.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import styles from './CountdownDisplay.module.css'

interface CountdownDisplayProps {
  deadline: Date
}

// Show "Gün" only while we're before this moment
const SHOW_DAYS_BEFORE = new Date('2026-04-24T00:00:00')

function getParts(deadline: Date, now: Date) {
  const ms      = Math.max(0, deadline.getTime() - now.getTime())
  const days    = Math.floor(ms / 86_400_000)
  const hours   = Math.floor((ms % 86_400_000) / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000)  / 60_000)
  const seconds = Math.floor((ms % 60_000)      / 1_000)
  return { days, hours, minutes, seconds }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function CountdownDisplay({ deadline }: CountdownDisplayProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000)
    return () => clearInterval(id)
  }, [])

  const isPreEvent = now < SHOW_DAYS_BEFORE
  const showDays   = isPreEvent
  const { days, hours, minutes, seconds } = getParts(deadline, now)
  const label = isPreEvent ? 'Uçuşa Kalan Süre' : 'Sonraki Kalkışa Kalan'

  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.units}>
        {showDays && (
          <>
            <div className={styles.unit}>
              <span className={`${styles.value} ${styles.gold}`}>{pad(days)}</span>
              <span className={styles.unitLabel}>Gün</span>
            </div>
            <span className={styles.sep}>:</span>
          </>
        )}
        <div className={styles.unit}>
          <span className={styles.value}>{pad(hours)}</span>
          <span className={styles.unitLabel}>Saat</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={styles.value}>{pad(minutes)}</span>
          <span className={styles.unitLabel}>Dakika</span>
        </div>
        <span className={styles.sep}>:</span>
        <div className={styles.unit}>
          <span className={`${styles.value} ${styles.seconds}`}>{pad(seconds)}</span>
          <span className={styles.unitLabel}>Saniye</span>
        </div>
      </div>
      {isPreEvent && (
        <p className={styles.subtext}>
          24 Nisan 2026 · Kremlin Palace, <span className={styles.gold}>Antalya</span>
        </p>
      )}
    </motion.div>
  )
}
